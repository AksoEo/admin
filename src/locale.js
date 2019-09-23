import config from './config.val';

const startYear = 2019;
const thisYear = new Date(config.buildTime).getUTCFullYear();
const copyrightYear = thisYear === startYear ? thisYear : `${startYear}–${thisYear}`;

/** The default locale (Esperanto). */
export default {
    // Information shown in the sidebar
    meta: {
        copyright: `© ${copyrightYear}`,
        copyrightHolder: 'TEJO',
        copyrightHref: 'https://tejo.org',
        license: 'MIT-Permesilo',
        githubHref: 'https://github.com/AksoEo',
        github: 'GitHub',
    },
    // App header bar
    header: {
        // Hamburger button
        menu: 'Menuo',
        // Overflow menu item
        overflow: 'Pli',
        // Back button
        back: 'Reen',
    },
    // Sidebar
    sidebar: {
        // Search input placeholder
        search: 'Serĉi',
        logout: 'Elsaluti',
    },
    documentTitleTemplate: pageTitle => `${pageTitle} | AKSO-Administranto`,
    // Page titles
    pages: {
        home: 'Hejmo',
        members: 'Membroj',
        membership: 'Membreco',
        email: 'Amasmesaĝoj',
        magazines: 'Revuoj',
        statistics: 'Statistiko',
        congresses: 'Kongresoj',
        payments: 'Pagoj',
        elections: 'Voĉdonado',
        newsletters: 'Bultenoj',
        administration: 'Administrado',
        lists: 'Listoj',
        reports: 'Raportoj',
        documents: '[[Ŝpureblaj dokumentoj]]',
    },
    // Login screen
    login: {
        // Used in the document title
        title: 'Ensaluti',
        username: 'UEA-kodo aŭ retpoŝtadreso',
        password: 'Pasvorto',
        confirmPassword: 'Pasvorto denove',
        continue: 'Daŭrigi',
        securityCode: 'Sekurkodo',
        createPasswordPlaceholder: 'Skribu pasvorton',
        confirmPasswordPlaceholder: 'Skribu pasvorton denove',
        bypassTotp: 'Memori tiun ĉi aparaton dum 60 tagoj',
        bypassTotpDescription: 'Nur uzu tiun ĉi funkcion ĉe personaj komputiloj.',
        // Text shown above the security code input
        securityCodeDescription: 'Bonvolu enmeti sekurkodon generitan de via duafaktora aplikaĵo.',
        // The following three are both a link and a title
        forgotPassword: 'Mi forgesis mian pasvorton',
        forgotCode: 'Mi forgesis mian UEA-kodon',
        lostSecurityCode: 'Mi ne povas generi sekurkodon',
        // Login progress indicator titles
        detailsStage: 'Detaloj',
        createPasswordStage: 'Krei pasvorton',
        resetPasswordStage: 'Rekrei pasvorton',
        securityCodeStage: 'Sekurkodo',
        // Login button
        login: 'Ensaluti',

        logout: 'Elsaluti',

        // Errors
        invalidUEACode: 'Nevalida UEA-kodo aŭ retpoŝtadreso',
        invalidSecurityCode: 'Bonvolu enmeti vian sesciferan sekurkodon',
        passwordMismatch: 'Bonvolu skribi la saman pasvorton dufoje',
        invalidLogin: {
            ueaCode: 'Nevalida UEA-kodo aŭ pasvorto',
            email: 'Nevalida retpoŝtadreso aŭ pasvorto',
        },
        genericError: 'Ne sukcesis ensaluti, bv. reprovi poste',
        notAdmin: 'Nur administrantoj povas uzi tiun ĉi retejon',
        notAdminLogout: 'Bonvolu elsaluti kaj reensaluti per konto de administranto se vi volas uzi la administran sistemon.',
        genericTotpError: 'Ne sukcesis ensaluti, bv. reprovi poste',
        invalidTotp: 'Nevalida sekurkodo',
    },
    listView: {
        filters: 'Filtriloj',
        submit: 'Serĉi',
        unsubmit: 'Reveni al serĉilo',
        fieldPicker: {
            title: 'Montrotaj kampoj',
            searchPlaceholder: 'Serĉi kampon',
        },
        sorting: {
            none: 'ne ordigata',
            asc: 'kreskanta',
            desc: 'malkreskanta',
        },
        json: {
            loading: 'Ŝarĝas...',
            enable: 'Uzi JSON-filtrilojn',
            disable: 'Uzi facilajn filtrilojn',
            help: {
                title: 'JSON-helpo',
                content: `[[json help content goes here. if you would like this to be raw html\
                that can be arranged (it’s not like we’re going to html inject ourselves though\
                this locale object isn’t immutable so technically that is a possibility but who\
                would even do that)\
                if this is going to be interactive (api doc browser?) that too can be\
                arranged]]`,
            },
        },
        resultStats: (count, filtered, total, time) => {
            const plural = n => n === 1 ? '' : 'j';
            return `Montras ${count} rezulto${plural(count)}n ${
                filtered ? `filtrita${plural(count)}n ` : ''}el entute ${
                total} trovita${plural(total)} en ${time}`;
        },
        globalFilterNotice: 'Ĉiuj viaj serĉoj estas limigitaj laŭ membrofiltrilo. Okaze de demandoj, kontaktu vian administranton.',
        noResults: 'Trovis neniujn rezultojn',
        pagination: {
            displayedRows: ({ from, to, count }) => `${from}–${to} el ${count}`,
            rowsPerPage: 'Rezultoj po paĝo',
        },
        error: 'Eraro',
        errors: {
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
            invalidJSON: 'Estas tajperaro en la JSON-filtriloj. Detalaj informoj troviĝas en la JSON-filtrilkampo.',
        },
        csvExport: {
            menuItem: 'Elporti kiel CSV',
            title: 'Elporti kiel CSV',
            beginExport: 'Elporti',
            tryResumeExport: 'Provi daŭrigi',
            abortExport: 'Nuligi',
            download: 'Elŝuti CSV',

            commaSeparated: 'CSV (komoj)',
            tabSeparated: 'TSV (taboj)',
        },
        savedFilters: {
            savedFilters: 'Konservitaj filtriloj',
            load: 'Ŝarĝi',
            save: 'Konservi',
            error: 'Ne sukcesis konservi',
            name: 'Nomo',
            description: 'Priskribo',
        },
        detail: {
            edit: 'Redakti',
            editCancel: 'Nuligi',
            editSave: 'Konservi',
            delete: 'Forigi',
            deleteCancel: 'Nuligi',
            saveDialog: {
                title: 'Konservado',
                modComment: 'Priskribo de ŝanĝoj farotaj',
                diffTitle: 'Redaktitaj kampoj',
                noChanges: 'Neniuj ŝanĝoj faritaj',
                commit: 'Aktualigi',
            },
        },
    },
    data: {
        requiredField: '[[this field is required]]',
        addressFields: {
            country: 'Lando',
            countryArea: 'Regiono',
            city: 'Urbo',
            cityArea: 'Urboparto',
            streetAddress: 'Stratadreso',
            postalCode: 'Poŝtkodo',
            sortingCode: 'Ordigkodo',
        },
        ueaCode: {
            newCode: 'Seslitera UEA-kodo',
            invalidUEACode: 'Nevalida seslitera UEA-kodo',
            codeTaken: 'La UEA-kodo estas jam uzata',
        },
    },
    // Members page
    members: {
        search: {
            title: 'Serĉi membrojn',
            titleFilter: 'Filtri membrojn',
            fields: {
                nameOrCode: 'Nomo aŭ UEA-kodo',
                email: 'Retpoŝtadreso',
                landlinePhone: 'Hejma telefono',
                cellphone: 'Poŝtelefono',
                officePhone: 'Oficeja telefono',
                address: 'Adreso',
                notes: 'Notoj',
            },
            placeholders: {
                nameOrCode: 'Ekz. xxtejo aŭ Zamenhof',
                email: 'Ekz. zamenhof@co.uea.org',
                landlinePhone: 'Ekz. +314666…',
                cellphone: 'Ekz. +314666…',
                officePhone: 'Ekz. +314666…',
                address: 'Ekz. Nieuwe Binnenweg',
                notes: 'Serĉi en notoj',
            },
            filters: {
                age: 'Aĝo',
                hasOldCode: 'Kvarlitera UEA-kodo',
                hasEmail: 'Retpoŝtadreso',
                codeholderType: 'Membrospeco',
                enabled: 'Konto ŝaltita',
                isDead: 'Mortinta',
                country: 'Lando',
                birthdate: 'Naskiĝtago',
                hasPassword: 'Kreis konton',
                membership: 'Membreckategorioj',
                isActiveMember: 'Aktiva membro en',
                deathdate: 'Mortdato',
            },
            agePrime: 'jarkomence',
            ageBirthYear: range => `naskiĝintoj en ${range}`,
            codeholderTypes: {
                all: 'ne gravas',
                human: 'homo',
                org: 'organizo',
            },
            enabledStates: {
                all: 'ne gravas',
                enabled: 'ŝaltita',
                disabled: 'malŝaltita',
            },
            boolean: {
                all: 'ne gravas',
                yes: 'jes',
                no: 'ne',
            },
            existence: {
                all: 'ne gravas',
                yes: 'ekzistas',
                no: 'ne ekzistas',
            },
            countries: {
                // section labels in <select>
                countryGroups: 'Landaroj',
                countries: 'Landoj',
                // types
                all: 'ne gravas',
                fee: 'Paglando',
                address: 'Loĝlando',
                dialogTitle: 'Elekti land(ar)ojn',
                placeholder: 'Elekti land(ar)ojn',
                search: 'Serĉi land(ar)ojn',
                selectAll: 'Elekti ĉiujn',
                deselectAll: 'Malelekti ĉiujn',
            },
            membership: {
                invert: {
                    yes: 'ne havas',
                    no: 'havas',
                },
                lifetime: {
                    yes: 'dumviva',
                    no: 'unujara',
                    all: 'ne gravas',
                },
                givesMembership: {
                    yes: 'membrecdona',
                    no: 'nemembrecdona',
                    all: 'ne gravas',
                },
                conjunction: 'kaj',
                placeholder: 'Elekti kategoriojn',
            },
            resetFilters: 'Nuligi filtrilojn',
        },
        fields: {
            codeholderType: 'Membrospeco',
            name: 'Nomo',
            code: 'UEA-kodo',
            country: 'Lando',
            disjunctCountry: (fee, country) => `Pagas laŭ ${fee}, loĝas en ${country}`,
            age: 'Aĝo',
            ageFormat: (age, agep) => `${age} (${agep} jarkomence)`,
            email: 'Retpoŝtadreso',
            addressLatin: 'Adreso',
            addressCity: 'Urbo',
            addressCountryArea: 'Regiono',
            codeholderTypes: {
                human: 'Homo',
                org: 'Organizo',
            },
            codeholderDisabledTitle: 'malŝaltita',
            codeholderDeadTitle: 'mortinta',
            notes: 'Notoj',
            landlinePhone: 'Hejma telefono',
            cellphone: 'Poŝtelefono',
            officePhone: 'Oficeja telefono',
            enabled: 'Konto ŝaltita',
            enabledStates: {
                yes: 'Jes',
                no: 'Ne',
            },
            isDead: 'Mortinta',
            feeCountry: 'Paglando',
            birthdate: 'Naskiĝtago',
            deathdate: 'Mortdato',
            honorific: 'Titolo',
            profession: 'Profesio',
            membership: 'Membreco',
        },
        csvFields: {
            membership: 'Membreco (resumo)',
        },
        csvFilename: 'membroj',
        csvOptions: {
            countryLocale: 'Lingvo de landnomoj',
            countryLocales: {
                eo: 'Esperanto',
                en: 'English',
                fr: 'Français',
                es: 'Español',
                nl: 'Nederlands',
                pt: 'Português',
                sk: 'Slovenčina',
                zh: '中文',
                de: 'Deutsch',
            },
        },
        addMember: {
            menuItem: 'Aldoni membron',
            title: 'Aldoni membron',
            newCode: 'UEA-kodo seslitera',
            firstNameLegal: 'Jura persona nomo',
            fullName: 'Plena nomo',
            newCodePlaceholder: 'xxxxxx',
            add: 'Aldoni',
            invalidUEACode: 'Nevalida seslitera UEA-kodo',
            noName: 'Nomo estas deviga',
            invalidHumanCode: 'UEA-kodoj por homoj ne rajtas komenciĝi je xx',
            invalidOrgCode: 'UEA-kodoj por organizoj devas komenciĝi je xx',
            newCodeTaken: 'La UEA-kodo estas jam uzata',
            genericError: 'Okazis neatendita eraro dum kreado de membro, bv. reprovi poste',
        },
        detail: {
            title: 'Membro',
            editingTitle: 'Redakti membron',
            deleteConfirm: 'Ĉu vi certas, ke vi volas forigi tiun ĉi membron? Ne eblas malfari tion ĉi.',
            historyTitle: field => `[[${field} history title]]`,
            fields: {
                // TODO: deduplicate with above
                name: 'Nomo',
                code: 'UEA-kodo',
                enabled: 'Konto ŝaltita',
                isDead: 'Mortinta',
                birthdate: 'Naskiĝtago',
                deathdate: 'Mortdato',
                codeholderType: 'Membrospeco',
                newCode: 'Seslitera UEA-kodo',
                oldCode: 'Kvarlitera UEA-kodo',
                email: 'Retpoŝtadreso',
                nameLegal: 'Jura nomo',
                nameAbbrev: 'Mallongigo',
                honorific: 'Titolo',
                firstNameLegal: 'Jura persona nomo',
                lastNameLegal: 'Jura familia nomo',
                firstName: 'Persona nomo',
                lastName: 'Familia nomo',
                fullName: 'Plena nomo',
                address: 'Adreso',
                feeCountry: 'Paglando',
                profession: 'Profesio',
                landlinePhone: 'Hejma telefono',
                cellphone: 'Poŝtelefono',
                officePhone: 'Oficeja telefono',
                notes: 'Notoj',
            },
            membership: 'Membreckategorioj',
            noMembership: '[[no memberships]]',
            addMembership: '[[add membership]]',
            postalAddress: '[[postal address]]',
            postalLocale: '[[lingvo de adreso]]',
            honorificSuggestions: [
                'S-ro',
                'S-ino',
                'S-ano',
                'Prof.',
                'Prof-ino',
                'D-ro',
                'D-ino',
                'Mag.',
                'Mag-ino',
                'Fraŭlo',
                'F-ino',
                'Inĝ.',
                'Inĝ-ino',
                'Pastro',
                'Pastrino',
                'Civitano',
                'Ges-ro',
            ],
            cropProfilePicture: '[[crop profile picture]]',
            cancelProfilePicture: 'Nuligi',
            setProfilePicture: '[[set/upload]]',
        },
        addrLabelGen: {
            menuItem: '[[gen address labels]]', // translation note: pls keep it short
            title: '[[gen address labels]]',
            labels: {
                language: '[[language]]',
                latin: '[[latin]]',
                includeCode: '[[includeCode]]',
                paper: '[[paper]]',
                margins: '[[margins]]',
                cols: '[[cols]]',
                rows: '[[rows]]',
                colGap: '[[colGap]]',
                rowGap: '[[rowGap]]',
                cellPadding: '[[cellPadding]]',
                fontSize: '[[fontSize]]',
                drawOutline: '[[drawOutline]]',
            },
            paperSizes: {
                A3: 'A3',
                A4: 'A4',
                A5: 'A5',
                LETTER: '[[letter]]',
                FOLIO: '[[folio]]',
                LEGAL: '[[legal]]',
                EXECUTIVE: '[[executive]]',
            },
        },
    },
};
