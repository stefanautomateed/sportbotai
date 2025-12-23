const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const predictions = await prisma.prediction.findMany({
      where: {
        OR: [
          { matchName: { contains: 'Memphis' } },
          { matchName: { contains: 'Thunder' } },
          { matchName: { contains: 'Grizzlies' } }
        ]
      },
      select: {
        matchName: true,
        prediction: true,
        valueBetSide: true,
        valueBetEdge: true,
        conviction: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Predictions found:', predictions.length);
    console.log(JSON.stringify(predictions, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
