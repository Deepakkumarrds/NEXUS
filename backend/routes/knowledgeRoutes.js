const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');

// GET metadata (departments, categories, tags for filters)
router.get('/meta', knowledgeController.getMetadata);

// GET all articles (supports ?department=&category=&search=&tag=)
router.get('/', knowledgeController.getAllArticles);

// POST create article
router.post('/', knowledgeController.createArticle);

// GET single article
router.get('/:id', knowledgeController.getArticleById);

// PUT update article
router.put('/:id', knowledgeController.updateArticle);

// DELETE article
router.delete('/:id', knowledgeController.deleteArticle);

module.exports = router;
