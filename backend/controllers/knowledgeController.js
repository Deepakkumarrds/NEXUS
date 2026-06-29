const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all articles (with optional filters)
const getAllArticles = async (req, res) => {
  try {
    const { department, category, search, tag } = req.query;

    const where = {};

    if (department) where.department = department;
    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        department: true,
        tags: true,
        created_at: true,
        updated_at: true,
        author: { select: { name: true } }
      },
      orderBy: { updated_at: 'desc' }
    });

    res.json({ status: 'success', data: articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET single article
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id },
      include: { author: { select: { name: true, department: true } } }
    });

    if (!article) {
      return res.status(404).json({ status: 'error', message: 'Article not found' });
    }

    res.json({ status: 'success', data: article });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_TOKEN);

// Generate embedding using HuggingFace
async function generateEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    });
    return response;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return []; // Return empty array if it fails, so it doesn't break saving
  }
}

// POST create article
const createArticle = async (req, res) => {
  try {
    const { title, content, category, department, tags } = req.body;
    const created_by = req.user?.id || req.body.created_by;

    if (!title || !content || !category || !department) {
      return res.status(400).json({ status: 'error', message: 'title, content, category, and department are required' });
    }

    const textToEmbed = `Title: ${title}\nCategory: ${category}\nDepartment: ${department}\nTags: ${tags ? tags.join(', ') : ''}\n\nContent: ${content}`;
    const embedding = await generateEmbedding(textToEmbed);

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        content,
        category,
        department,
        tags: tags || [],
        embedding,
        created_by
      },
      include: { author: { select: { name: true } } }
    });

    res.status(201).json({ status: 'success', data: article });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// PUT update article
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, department, tags } = req.body;

    let embedding = undefined;
    if (title || content || category || department || tags) {
      // Fetch current article to construct full text for new embedding if partial update
      const current = await prisma.knowledgeArticle.findUnique({ where: { id } });
      const newTitle = title || current.title;
      const newContent = content || current.content;
      const newCategory = category || current.category;
      const newDept = department || current.department;
      const newTags = tags || current.tags;

      const textToEmbed = `Title: ${newTitle}\nCategory: ${newCategory}\nDepartment: ${newDept}\nTags: ${newTags ? newTags.join(', ') : ''}\n\nContent: ${newContent}`;
      embedding = await generateEmbedding(textToEmbed);
    }

    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(department && { department }),
        ...(tags !== undefined && { tags }),
        ...(embedding && embedding.length > 0 && { embedding })
      },
      include: { author: { select: { name: true } } }
    });

    res.json({ status: 'success', data: article });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// DELETE article
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.knowledgeArticle.delete({ where: { id } });
    res.json({ status: 'success', message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET departments and categories (for filters)
const getMetadata = async (req, res) => {
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      select: { department: true, category: true, tags: true }
    });

    const departments = [...new Set(articles.map(a => a.department))].sort();
    const categories = [...new Set(articles.map(a => a.category))].sort();
    const allTags = [...new Set(articles.flatMap(a => a.tags))].sort();

    res.json({ status: 'success', data: { departments, categories, tags: allTags } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getMetadata
};
