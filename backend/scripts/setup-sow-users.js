const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if Management role exists, if not create it
    let managementRole = await prisma.role.findFirst({ where: { role_name: 'Management' } });
    if (!managementRole) {
      managementRole = await prisma.role.create({
        data: {
          role_name: 'Management',
          description: 'Management Team (Approvers)'
        }
      });
      console.log('Created Management role:', managementRole.id);
    } else {
      console.log('Found Management role:', managementRole.id);
    }

    // Check if Brand Manager role exists, if not create it
    let brandManagerRole = await prisma.role.findFirst({ where: { role_name: 'Brand Manager' } });
    if (!brandManagerRole) {
      brandManagerRole = await prisma.role.create({
        data: {
          role_name: 'Brand Manager',
          description: 'Brand Manager (SOW Creators)'
        }
      });
      console.log('Created Brand Manager role:', brandManagerRole.id);
    } else {
      console.log('Found Brand Manager role:', brandManagerRole.id);
    }

    const passwordHash = await bcrypt.hash('Password@123', 10);

    // Create Utkarsh
    const utkarsh = await prisma.user.upsert({
      where: { email: 'utkarsh.purohit@rdsdigital.in' },
      update: {
        role_id: brandManagerRole.id,
      },
      create: {
        name: 'Utkarsh Purohit',
        email: 'utkarsh.purohit@rdsdigital.in',
        password_hash: passwordHash,
        role_id: brandManagerRole.id,
        department: 'Brand Management',
        designation: 'Brand Manager'
      }
    });
    console.log('Upserted Utkarsh:', utkarsh.id);

    // Create Deepak
    const deepak = await prisma.user.upsert({
      where: { email: 'deepak@rdsdigital.in' },
      update: {
        role_id: managementRole.id,
      },
      create: {
        name: 'Deepak',
        email: 'deepak@rdsdigital.in',
        password_hash: passwordHash,
        role_id: managementRole.id,
        department: 'Management',
        designation: 'Director'
      }
    });
    console.log('Upserted Deepak:', deepak.id);

  } catch (err) {
    console.error('Error in script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
