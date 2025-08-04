import { Kafka } from 'kafkajs';

async function createTopics() {
  const kafka = new Kafka({
    clientId: 'admin-client',
    brokers: ['localhost:9092'],
  });

  const admin = kafka.admin();
  await admin.connect();

  const existingTopics = await admin.listTopics();

  const topicsToCreate = ['truck-data', 'truck-route-updates'].filter(t => !existingTopics.includes(t));

  if (topicsToCreate.length > 0) {
    await admin.createTopics({
      topics: topicsToCreate.map(t => ({
        topic: t,
        numPartitions: 1,
        replicationFactor: 1,
      })),
    });
    console.log('Topics créés :', topicsToCreate);
  } else {
    console.log('Tous les topics existent déjà.');
  }

  await admin.disconnect();
}

createTopics().catch(console.error);
