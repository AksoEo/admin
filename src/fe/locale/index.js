import config from '../../config.val';

const startYear = 2019;
const thisYear = new Date(config.buildTime).getUTCFullYear();
const copyrightYear = `${startYear}–${thisYear}`;

export const timestampFormat = 'LLL [UTC]';
// for dates that are today
export const timestampFormatToday = '[hodiaŭ] LT [UTC]';

export const insecureContext = 'La paĝo ne estas sekura (http)!';

export const meta = {
    copyright: `© ${copyrightYear}`,
    copyrightHolder: 'TEJO',
    copyrightHref: 'https://tejo.org',
    license: 'MIT-Permesilo',
    sourceHref: 'https://github.com/AksoEo',
    source: 'GitHub',
};

export * from './data';
export * from './errors';
export * from './login';
export * from './app';
export * from './codeholders';
export * from './memberships';
export * from './roles';
export * from './payments';
export * from './admin';
export * from './lists';
export * from './votes';