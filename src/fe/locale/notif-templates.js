export const notifTemplates = {
    title: 'Amasmesaĝoj',
    detailTitle: 'Amasmesaĝo',
    search: {
        placeholders: {
            name: 'Serĉi nomon',
            description: 'Serĉi priskribon',
            subject: '[[Search subjects]]',
        },
    },
    fields: {
        base: '[[Base]]',
        org: 'Organizo',
        name: 'Nomo',
        description: 'Priskribo',
        intent: '[[Intent]]',
        subject: '[[Subject]]',
        script: '[[Script]]',
        from: '[[From]]',
        fromName: '[[FromName]]',
        replyTo: '[[ReplyTo]]',
        html: '[[Html]]',
        text: '[[Text]]',
        modules: '[[Modules]]',
    },
    bases: {
        raw: '[[Raw]]',
        inherit: '[[Inherited]]',
    },
    raw: {
        noHtmlVersion: '[[Missing html version]]',
        noTextVersion: '[[Missing text version]]',
        unknownVar: v => `[[Unknown variable “${v}”]]`,
    },
    modules: {
        textButton: '[[Button]]',
        textButtonHref: '[[Link]]',
        textButtonLabel: '[[Label]]',
        imageUrl: '[[URL]]',
        imageAlt: '[[Image Description]]',
    },
    intents: {
        codeholder: 'Membro',
    },
    sendIntent: '[[Send notif]]',
    preview: {
        title: 'Antaŭvido',
        button: 'Antaŭvidi',
        tabs: {
            html: '[[HTML]]',
            text: '[[Text]]',
        },
    },

    templating: {
        insertTitle: '[[Insert template construct]]',
    },

    create: {
        title: '[[Create template]]',
        button: 'Krei',
    },
    duplicate: {
        title: '[[Duplicate template]]',
        menuItem: '[[Duplicate]]',
        description: '[[This will create a new template with identical data.]]',
        button: '[[Duplicate]]',
    },
    update: {
        menuItem: 'Redakti',
        title: '[[Edit template]]',
        button: 'Aktualigi',
    },
    delete: {
        menuItem: 'Forigi',
        title: '[[Delete template]]',
        description: '[[Ĉu vi certas, ke vi volas forigi tiun ĉi x?]]',
        button: 'Forigi',
    },

    sendCodeholder: {
        title: '[[Send codeholder notif]]', // should be short
        description: '[[To send a codeholder notification, first pick the target codeholders using search and filters, then select "send notification" from the menu in the top right corner.]]',
        ok: '[[OK]]',
    },
};

export const notifTemplateIntentExamples = {
    codeholder: {
        id: 1234,
        name: '[[Max Mustermann]]',
        oldCode: 'abcd-l',
        newCode: 'abcdef',
        codeholderType: 'human',
        hasPassword: true,
        addressFormatted: '[[Insert some example address please]]',
        addressLatin: {
            country: '[[Also]]',
            countryArea: '[[all]]',
            city: '[[this]]',
            cityArea: '[[stuff]]',
            streetAddress: '[[please]]',
            postalCode: '[[thank]]',
            sortingCode: '[[you]]',
        },
        feeCountry: 'nl',
        email: 'ekzemplo@akso.org',
        birthdate: '1990-01-01', // this is not 1970 so it's not unix 0
        age: 30,
        agePrimo: 30,
        cellphone: '+15551234',
        officePhone: '+15552345',
        landlinePhone: '+15555678',
    },
};
