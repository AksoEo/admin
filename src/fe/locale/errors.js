export const errors = {
    unknown: err => `Okazis nekonata eraro: ${err}`,
    invalidSearchQuery: {
        pre: [
            'La serĉkriterio ne estas valida. Ĉiuj signoj ne literaj aŭ numeraj estas ignoritaj.',
            'Eblas uzi la jenajn kontrolsignojn por fari malsimplan serĉon:',
        ],
        list: [
            ['*', ' post vorto por permesi ajnajn sekvantajn signojn post la vorto'],
            ['+', ' antaŭ vorto por postuli ĝian ekziston'],
            ['-', ' antaŭ vorto por postuli ĝian malekziston'],
            ['""', '-citilojn ĉirkaŭ frazo aŭ vorto por postuli la ekzaktan kombinon de la vortoj'],
        ],
        post: ['Serĉoj kun kontrolsignoj ne rajtas enhavi vortojn malpli longajn ol tri signoj.'],
    },
    'bad-request': err => `Nevalida peto: ${err}`,
    'unauthorized': 'Mankas aŭtentiko',
    'forbidden': 'Mankas permeso',
    'not-found': 'La paĝo ne estis trovita',
    'conflict': 'Okazis interna konflikto, bonvolu reprovi',
    'internal-server-error': 'Okazis interna eraro',
};
