import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator';
import randomSeed from 'random-seed';
import { prismaClient } from '..';
import { getUser } from './DatabaseUtils';

export function generateName(seed?: string) {
  if (!seed) seed = randomSeed.create().string(16);
  const prefixedSeed = process.env.RANDOM_SEED_PREFIX + seed;
  const randomNumber = randomSeed.create(prefixedSeed + ':number').intBetween(10, 99);
  return (
    uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      style: 'capital',
      length: 2,
      separator: '',
      seed: randomSeed.create(prefixedSeed).intBetween(0, 1e10),
    }) + randomNumber
  );
}

export async function generateRandomPrivateNameForUser(userId: bigint): Promise<string> {
  let generatedName = generateName();
  let nameAvailable = false;
  while (!nameAvailable) {
    const foundUser = await prismaClient.user.findUnique({
      where: {
        private_name: generatedName,
      },
    });
    if (foundUser === null) {
      nameAvailable = true;
      break;
    }
  }
  await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      private_name: generatedName,
    },
  });
  return generatedName;
}

export async function getPrivateNameForUser(userId: bigint): Promise<string> {
  const user = await getUser(userId);
  if (user === null) return '';
  if (user.private_name !== null) return user.private_name;
  return generateRandomPrivateNameForUser(userId);
}
