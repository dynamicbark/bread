import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator';
import randomSeed from 'random-seed';

export function generateName(seed: string) {
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
