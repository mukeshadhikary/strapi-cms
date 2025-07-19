module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/clerk/webhook',
      handler: 'clerk-webhook.handleWebhook',
      config: {
        auth: false,
        policies: [], // open route, we’ll handle security manually
      },
    },
  ],
};


