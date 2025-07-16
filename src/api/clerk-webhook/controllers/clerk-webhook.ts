import crypto from 'crypto';

// module.exports = {
//   async handleWebhook(ctx) {
//     const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
//     const receivedSig = ctx.request.headers['clerk-signature'];
//     const rawBody = ctx.request.body;

//     // 1. Verify Clerk webhook signature
//     const expectedSig = crypto
//       .createHmac('sha256', webhookSecret)
//       .update(JSON.stringify(rawBody))
//       .digest('hex');

//     if (receivedSig !== expectedSig) {
//       return ctx.unauthorized('Invalid webhook signature');
//     }

//     const { id, email_addresses, first_name, last_name, username } = rawBody;

//     const email = email_addresses?.[0]?.email_address || null;

//     if (!email) return ctx.badRequest('Email not found');

//     // 2. Find user by email or Clerk ID
//     const existingUsers = await strapi.entityService.findMany('plugin::users-permissions.user', {
//       filters: {
//         $or: [
//           { email: email },
//           { clerk_id: id },
//         ],
//       },
//     });

//     const userData = {
//       email,
//       username: username || email.split('@')[0],
//       clerk_id: id,
//       first_name,
//       last_name,
//       confirmed: true,
//     };

//     let user;

//     if (existingUsers.length > 0) {
//       // 3. Update existing user
//       user = await strapi.entityService.update(
//         'plugin::users-permissions.user',
//         existingUsers[0].id,
//         { data: userData }
//       );
//     } else {
//       // 4. Create user without password
//       user = await strapi.entityService.create('plugin::users-permissions.user', {
//         data: {
//           ...userData,
//           password: crypto.randomBytes(32).toString('hex'), // set random password just in case
//         },
//       });
//     }

//     ctx.send({ ok: true, user });
//   },
// };






module.exports = {
  async handleWebhook(ctx) {
    try {
      console.log("🔔 Webhook received from Clerk");

      // STEP 1: Get the webhook data
      const body = ctx.request.body;
      const headers = ctx.request.headers;

      // STEP 2: Verify this request is really from Clerk (security)
      const isValid = await this.verifyWebhookSignature(body, headers);
      if (!isValid) {
        console.log("❌ Invalid webhook signature");
        ctx.status = 401;
        ctx.body = { error: "Unauthorized" };
        return;
      }

      // STEP 3: Handle different types of events
      const { type, data } = body;
      console.log(`📧 Event type: ${type}`);

      switch (type) {
        case "user.created":
          await this.handleUserCreated(data);
          break;
        case "user.updated":
          await this.handleUserUpdated(data);
          break;
        case "user.deleted":
          await this.handleUserDeleted(data);
          break;
        default:
          console.log(`🤷 Unknown event type: ${type}`);
      }

      // STEP 4: Tell Clerk everything went well
      ctx.status = 200;
      ctx.body = { success: true };
    } catch (error) {
      console.error("💥 Webhook error:", error);
      ctx.status = 500;
      ctx.body = { error: "Internal server error" };
    }
  },

  // Security: Verify the webhook is really from Clerk
  async verifyWebhookSignature(body, headers) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!secret) {
      console.error("❌ CLERK_WEBHOOK_SECRET not found in .env file");
      return false;
    }

    try {
      const signature = headers["svix-signature"];
      const timestamp = headers["svix-timestamp"];

      if (!signature || !timestamp) {
        console.error("❌ Missing signature or timestamp");
        return false;
      }

      // Create expected signature
      const payload = JSON.stringify(body);
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${payload}`)
        .digest("base64");

      const expectedSig = `v1,${expectedSignature}`;

      return signature === expectedSig;
    } catch (error) {
      console.error("❌ Signature verification failed:", error);
      return false;
    }
  },

  // Handle when a new user signs up in Clerk
  async handleUserCreated(userData) {
    console.log("👤 Creating new user from Clerk");

    try {
      // Extract user info from Clerk data
      const userInfo = this.extractUserInfo(userData);

      if (!userInfo.email) {
        console.error("❌ No email found for user");
        return;
      }

      // Check if user already exists
      const existingUser = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: {
            $or: [{ email: userInfo.email }, { clerkId: userInfo.clerkId }],
          },
        });

      if (existingUser) {
        console.log("👤 User already exists:", userInfo.email);
        return;
      }

      // Get the default role for new users
      const defaultRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({
          where: { type: "authenticated" },
        });

      if (!defaultRole) {
        console.error("❌ Default role not found");
        return;
      }

      // Create the user in Strapi
      const newUser = await strapi
        .query("plugin::users-permissions.user")
        .create({
          data: {
            email: userInfo.email,
            username: userInfo.username,
            clerkId: userInfo.clerkId,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            confirmed: true, // User is already confirmed in Clerk
            blocked: false,
            role: defaultRole.id,
            provider:"clerk", // Specify Clerk as the auth provider
            // No password needed - user authenticates through Clerk
            password: "__no_password__", // Placeholder, Clerk handles auth
          },
        });

      console.log("✅ User created successfully:", newUser.email);
    } catch (error) {
      console.error("💥 Error creating user:", error);
      throw error;
    }
  },

  // Handle when a user updates their profile in Clerk
  async handleUserUpdated(userData) {
    console.log("👤 Updating user from Clerk");

    try {
      const userInfo = this.extractUserInfo(userData);

      if (!userInfo.email) {
        console.error("❌ No email found for user");
        return;
      }

      // Find the user in Strapi
      const existingUser = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { clerkId: userInfo.clerkId },
        });

      if (!existingUser) {
        console.log("👤 User not found, creating new user");
        await this.handleUserCreated(userData);
        return;
      }

      // Update the user
      const updatedUser = await strapi
        .query("plugin::users-permissions.user")
        .update({
          where: { id: existingUser.id },
          data: {
            email: userInfo.email,
            username: userInfo.username,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
          },
        });

      console.log("✅ User updated successfully:", updatedUser.email);
    } catch (error) {
      console.error("💥 Error updating user:", error);
      throw error;
    }
  },

  // Handle when a user deletes their account in Clerk
  async handleUserDeleted(userData) {
    console.log("👤 Deleting user from Clerk");

    try {
      const clerkId = userData.id;

      // Find the user in Strapi
      const existingUser = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { clerkId: clerkId },
        });

      if (!existingUser) {
        console.log("👤 User not found for deletion");
        return;
      }

      // Delete the user
      await strapi.query("plugin::users-permissions.user").delete({
        where: { id: existingUser.id },
      });

      console.log("✅ User deleted successfully");
    } catch (error) {
      console.error("💥 Error deleting user:", error);
      throw error;
    }
  },

  // Helper function to extract user info from Clerk webhook data
  extractUserInfo(userData) {
    const { id, email_addresses, username, first_name, last_name } = userData;

    // Get the primary email address
    const primaryEmail = email_addresses?.find(
      (email) => email.id === userData.primary_email_address_id
    );

    return {
      clerkId: id,
      email: primaryEmail?.email_address || "",
      username: username || primaryEmail?.email_address?.split("@")[0] || "",
      firstName: first_name || "",
      lastName: last_name || "",
    };
  },

  // Optional: Generate Strapi JWT token for the user
  async generateJWT(user) {
    const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
      id: user.id,
      email: user.email,
    });

    return jwt;
  },
};