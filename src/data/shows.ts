import type { Show } from './types';

const presentation = {
  label: 'prezentarea cuplurilor, Observator, 4 sept 2026',
  url: 'https://observatornews.ro/media/insula-iubirii-incepe-azi-marcel-sa-intors-alaturi-de-sotia-lui-ca-sasi-testeze-casnicia-665208.html',
};

export const shows: Show[] = [
  {
    slug: 'insula-iubirii',
    name: 'Insula Iubirii',
    status: 'live',
    description:
      'Cinci cupluri își testează relația în Thailanda. Partenerii locuiesc separat, în două vile, alături de ispite, și află la bonfire ce a făcut celălalt. La final, fiecare cuplu decide dacă pleacă împreună sau separat.',
    image: { src: '/images/insula-iubirii.webp', alt: 'Insula Iubirii: o insulă în formă de inimă, văzută de sus' },
    facts: [
      { label: 'Post TV', value: 'Antena 1 și AntenaPLAY' },
      { label: 'Prezentator', value: 'Radu Vâlcan' },
      { label: 'Difuzare', value: 'Vineri 20:30, sâmbătă 20:00' },
      { label: 'Sezonul 10', value: 'Din 4 septembrie 2026' },
      { label: 'Filmat în', value: 'Thailanda' },
      { label: 'Format', value: 'Temptation Island' },
    ],
    links: [
      { label: 'Site oficial Antena 1', url: 'https://a1.ro/insula-iubirii/' },
      {
        label: 'Vezi pe AntenaPLAY',
        url: 'https://antenaplay.ro/insula-iubirii',
        prefix: 'Vezi pe',
        logo: { dark: '/images/antenaplay-dark.png', light: '/images/antenaplay-light.png', alt: 'AntenaPLAY' },
      },
    ],
    community: [],
    poll: {
      question: 'Câte cupluri pleacă împreună la final?',
      options: ['Niciunul sau unul', 'Două', 'Trei', 'Patru sau cinci'],
    },
    season: {
      number: 10,
      question: 'Cine pleacă împreună de pe insulă?',
      schedule: {
        start: '2026-09-04',
        slots: [
          { weekday: 5, time: '20:30' },
          { weekday: 6, time: '20:00' },
        ],
        skip: [],
        extra: [],
      },
      nightly: [
        {
          episode: 10,
          question: 'După tot ce s-a văzut până acum, tu ce ai face în locul Biancăi Iotu?',
          options: ['I-aș mai da o șansă lui Remi', 'Aș aștepta bonfire-ul final', 'Aș pleca singură de pe insulă'],
        },
      ],
      episodes: [
        { number: 1, date: '4 sept', summary: 'Premiera sezonului 10. Cuplurile ajung în Thailanda.' },
        { number: 2, date: '5 sept' },
        { number: 3, date: '11 sept', summary: 'Revederea dintre cupluri, cu replici înțepătoare între parteneri și ispite.' },
        { number: 4, date: '12 sept', summary: 'Flacăra ispitei s-a aprins pentru prima dată în acest sezon.' },
        { number: 5, date: '18 sept', summary: 'Primul bonfire al fetelor.' },
        { number: 6, date: '19 sept' },
        { number: 7, date: '25 sept' },
        { number: 8, date: '26 sept' },
        { number: 9, date: '2 oct' },
      ],
      couples: [
        {
          slug: 'nattasha-lorenzo',
          shortName: 'Nattasha și Lorenzo',
          a: { name: 'Nattasha Black', age: 31 },
          b: { name: 'Lorenzo Bălăucă', age: 31, role: 'Operator de excavator și creator de conținut pe TikTok' },
          together: '1 an și 7 luni',
          status: 'Necăsătoriți',
          location: 'Marea Britanie',
          why: 'Au petrecut aproape tot timpul împreună și vor să vadă cum rezistă relația atunci când sunt despărțiți.',
          source: presentation,
          history: {
            together: [66, 68, 70, 72, 71, 74, 76, 75, 78],
            temptation: [6, 6, 5, 5, 5, 5, 4, 5, 4],
          },
        },
        {
          slug: 'bianca-marco',
          shortName: 'Bianca și Marco',
          a: { name: 'Bianca Ghiurcă', age: 27, role: 'Antreprenoare' },
          b: { name: 'Marco Dăscăliuc', age: 33, role: 'Antreprenor' },
          together: '10 ani, dintre care 3 de căsnicie',
          status: 'Căsătoriți',
          location: 'Italia',
          why: 'Au împreună un bar. Marco vrea să arate că merită încrederea Biancăi.',
          source: presentation,
          history: {
            together: [60, 57, 58, 54, 56, 52, 50, 53, 51],
            temptation: [8, 9, 9, 10, 10, 11, 11, 11, 11],
          },
        },
        {
          slug: 'claudia-ionut',
          shortName: 'Claudia și Ionuț',
          a: { name: 'Claudia Ion', age: 25, role: 'Tehnician de unghii' },
          b: { name: 'Ionuț Mocăniță', age: 28, role: 'Hairstylist' },
          together: 'Aproape 3 ani',
          status: 'Necăsătoriți',
          why: 'S-au mutat recent împreună și vor să își consolideze încrederea unul în celălalt.',
          source: presentation,
          history: {
            together: [62, 60, 61, 55, 49, 45, 47, 44, 42],
            temptation: [7, 8, 8, 9, 10, 11, 11, 12, 12],
          },
        },
        {
          slug: 'armina-marcel',
          shortName: 'Armina și Marcel',
          a: { name: 'Armina', age: 27, role: 'Recepționeră la hotel' },
          b: { name: 'Marcel', age: 37, role: 'Ospătar și promotor imobiliar' },
          together: '3 ani, dintre care 2 de căsnicie',
          status: 'Căsătoriți',
          location: 'Tenerife',
          why: 'Vor să arate că relația lor rămâne stabilă și atunci când apar ispitele.',
          source: presentation,
          history: {
            together: [50, 46, 44, 40, 38, 36, 37, 34, 36],
            temptation: [10, 11, 12, 13, 14, 15, 14, 15, 15],
          },
        },
        {
          slug: 'bianca-remi',
          shortName: 'Bianca și Remi',
          a: { name: 'Bianca Iotu', age: 36, role: 'Instructor de pilates, cu studio propriu' },
          b: { name: 'Remi Dobre', age: 24, role: 'Creator de conținut pe TikTok' },
          together: '3 ani',
          status: 'Necăsătoriți',
          why: 'Vor să afle încotro merge relația și să comunice mai bine. Bianca își dorește stabilitate emoțională.',
          source: presentation,
          history: {
            together: [58, 55, 52, 47, 41, 38, 35, 33, 31],
            temptation: [8, 9, 10, 12, 14, 15, 15, 15, 15],
          },
          notes: {
            5: 'Primul bonfire al fetelor. După imaginile văzute, pentru Bianca au apărut îndoieli.',
          },
        },
      ],
    },
    news: [
      {
        date: '19 sept',
        source: 'Observator',
        title: 'Primul bonfire Insula Iubirii a adus lacrimi, îndoieli și informații zguduitoare. Emisiunea, lider de audiență',
        url: 'https://observatornews.ro/media/primul-bonfire-insula-iubirii-a-adus-lacrimi-indoieli-si-informatii-zguduitoare-emisiunea-lider-de-audienta-666654.html',
        kind: 'aired',
        couples: ['bianca-remi', 'claudia-ionut', 'bianca-marco'],
      },
      {
        date: '18 sept',
        source: 'Observator',
        title: '"Cred că merită ceva mai bun". Remi, concluzie după ce a văzut imaginile cu Bianca la Insula Iubirii',
        url: 'https://observatornews.ro/media/insula-iubirii-bianca-pusa-din-nou-la-incercare-de-declaratiile-printului-marco-666590.html',
        kind: 'aired',
        couples: ['bianca-remi'],
      },
      {
        date: '13 sept',
        source: 'Observator',
        title: 'Insula Iubirii, lider detașat de audiență, cu ediția în care s-a aprins în premieră flacăra',
        url: 'https://observatornews.ro/media/insula-iubirii-lider-detasat-de-audienta-cu-editia-in-care-sa-aprins-in-premiera-flacara-666045.html',
        kind: 'aired',
      },
      {
        date: '11 sept',
        source: 'Observator',
        title: 'La Insula Iubirii, după primele alegeri de date, în vila fetelor va răsuna în premieră cutia cu surprize',
        url: 'https://observatornews.ro/media/la-insula-iubirii-dupa-primele-alegeri-de-date-in-vila-fetelor-va-rasuna-in-premiera-cutia-cu-surprize-665899.html',
        kind: 'aired',
      },
      {
        source: 'Ziarul Profit',
        title: 'Insula Iubirii 2026. Șoc total, un alt cuplu este dat afară după nicio săptămână',
        url: 'https://www.ziarulprofit.ro/insula-iubirii-2026-soc-total-la-show-ul-matrimonial-un-alt-cuplu-este-dat-afara-dupa-nicio-saptamana/',
        kind: 'rumor',
      },
    ],
  },
  { slug: 'survivor', name: 'Survivor', status: 'soon' },
  { slug: 'asia-express', name: 'Asia Express', status: 'soon' },
  { slug: 'power-couple', name: 'Power Couple', status: 'soon' },
];

export const liveShows = shows.filter((s) => s.status === 'live' && s.season);
