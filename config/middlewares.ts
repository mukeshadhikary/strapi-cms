
// this is old middleware 
export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];


// this is just for development purpose middleware 
// export default [
//   'strapi::logger',
//   'strapi::errors',

//   {
//     name: 'strapi::cors',
//     config: {
//       origin: [
//         'http://localhost:3000',
//         'http://localhost:1337',
//         'https://*.ngrok.io', // allow all ngrok tunnels
//         'https://50f09303d8ad.ngrok-free.app/', // optional specific one
//         '*'
//       ],
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//       headers: '*',
//       credentials: true,
//     },
//   },

//   'strapi::security',
//   'strapi::poweredBy',
//   'strapi::query',
//   'strapi::body',
//   'strapi::session',
//   'strapi::favicon',
//   'strapi::public',
// ];