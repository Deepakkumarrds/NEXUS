const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const indianHolidays2026 = [
  { name: 'Republic Day', date: new Date('2026-01-26T00:00:00.000Z'), isNational: true },
  { name: 'Holi', date: new Date('2026-03-04T00:00:00.000Z'), isNational: true },
  { name: 'Good Friday', date: new Date('2026-04-03T00:00:00.000Z'), isNational: true },
  { name: 'Dr. Ambedkar Jayanti', date: new Date('2026-04-14T00:00:00.000Z'), isNational: true },
  { name: 'Eid-ul-Fitr', date: new Date('2026-03-20T00:00:00.000Z'), isNational: true },
  { name: 'Mahavir Jayanti', date: new Date('2026-04-02T00:00:00.000Z'), isNational: true },
  { name: 'Buddha Purnima', date: new Date('2026-05-01T00:00:00.000Z'), isNational: true },
  { name: 'Eid-ul-Adha (Bakrid)', date: new Date('2026-05-27T00:00:00.000Z'), isNational: true },
  { name: 'Muharram', date: new Date('2026-06-25T00:00:00.000Z'), isNational: true },
  { name: 'Independence Day', date: new Date('2026-08-15T00:00:00.000Z'), isNational: true },
  { name: 'Ganesh Chaturthi', date: new Date('2026-09-15T00:00:00.000Z'), isNational: true },
  { name: 'Gandhi Jayanti', date: new Date('2026-10-02T00:00:00.000Z'), isNational: true },
  { name: 'Dussehra', date: new Date('2026-10-20T00:00:00.000Z'), isNational: true },
  { name: 'Diwali / Deepavali', date: new Date('2026-11-08T00:00:00.000Z'), isNational: true },
  { name: 'Guru Nanak Jayanti', date: new Date('2026-11-24T00:00:00.000Z'), isNational: true },
  { name: 'Christmas Day', date: new Date('2026-12-25T00:00:00.000Z'), isNational: true }
];

async function main() {
  console.log('Seeding Indian Public Holidays for 2026...');

  for (const holiday of indianHolidays2026) {
    const existing = await prisma.holiday.findFirst({
      where: {
        holiday_name: holiday.name,
        holiday_date: holiday.date
      }
    });

    if (!existing) {
      await prisma.holiday.create({
        data: {
          holiday_name: holiday.name,
          holiday_date: holiday.date,
          is_national: holiday.isNational
        }
      });
      console.log(`Created Holiday: ${holiday.name} on ${holiday.date.toISOString().split('T')[0]}`);
    } else {
      console.log(`Holiday already exists: ${holiday.name}`);
    }
  }

  console.log('Holidays seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
