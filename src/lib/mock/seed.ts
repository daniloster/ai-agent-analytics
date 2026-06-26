import { Faker, en } from '@faker-js/faker'

export function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i)
  }
  return hash >>> 0
}

export function createSeededFaker(
  from: string,
  to: string,
  teamId: string | undefined
): Faker {
  const seed = hashString(from + to + (teamId ?? ''))
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}
