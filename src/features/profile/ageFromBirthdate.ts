export function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!match) return null;
  const born = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const notYetHadBirthdayThisYear =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());
  if (notYetHadBirthdayThisYear) age -= 1;
  return age;
}
