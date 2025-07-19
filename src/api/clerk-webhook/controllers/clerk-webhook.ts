const { Webhook } = require('svix');

module.exports = {
  async handleWebhook(ctx) {
    try {
      console.log("🔔 Webhook received from Clerk");

      const body = ctx.request.body;
      const headers = ctx.request.headers;

      const isValid = await this.verifyWebhookSignature(body, headers);
      if (!isValid) {
        console.log("❌ Invalid webhook signature");
        ctx.status = 401;
        ctx.body = { error: "Unauthorized" };
        return;
      }

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

      ctx.status = 200;
      ctx.body = { success: true };
    } catch (error) {
      console.error("💥 Webhook error:", error);
      ctx.status = 500;
      ctx.body = { error: "Internal server error" };
    }
  },

  async verifyWebhookSignature(body, headers) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!secret) {
      console.error("❌ CLERK_WEBHOOK_SECRET not found");
      return false;
    }

    try {
      const wh = new Webhook(secret);
      const payload = JSON.stringify(body);
      wh.verify(payload, headers);
      console.log("✅ Signature verified with Svix library");
      return true;
    } catch (error) {
      console.error("❌ Svix verification failed:", error.message);
      return false;
    }
  },

  async handleUserCreated(userData) {
    console.log("👤 Creating new user from Clerk");

    try {
      const userInfo = this.extractUserInfo(userData);
      if (!userInfo.email) {
        console.error("❌ No email found for user");
        return;
      }

      const existingUser = await strapi.query("plugin::users-permissions.user").findOne({
        where: {
          $or: [{ email: userInfo.email }, { clerkId: userInfo.clerkId }],
        },
      });

      if (existingUser) {
        console.log("👤 User already exists:", userInfo.email);
        return;
      }

      const defaultRole = await strapi.query("plugin::users-permissions.role").findOne({
        where: { type: "authenticated" },
      });

      if (!defaultRole) {
        console.error("❌ Default role not found");
        return;
      }

      const newUser = await strapi.query("plugin::users-permissions.user").create({
        data: {
          email: userInfo.email,
          username: userInfo.username,
          clerkId: userInfo.clerkId,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          confirmed: true,
          blocked: false,
          role: defaultRole.id,
          provider: "clerk",
          password: "__no_password__",
        },
      });

      console.log("✅ User created successfully:", newUser.email);
    } catch (error) {
      console.error("💥 Error creating user:", error);
      throw error;
    }
  },

  async handleUserUpdated(userData) {
    console.log("👤 Updating user from Clerk");

    try {
      const userInfo = this.extractUserInfo(userData);
      if (!userInfo.email) {
        console.error("❌ No email found for user");
        return;
      }

      const existingUser = await strapi.query("plugin::users-permissions.user").findOne({
        where: { clerkId: userInfo.clerkId },
      });

      if (!existingUser) {
        console.log("👤 User not found, creating new user");
        await this.handleUserCreated(userData);
        return;
      }

      const updatedUser = await strapi.query("plugin::users-permissions.user").update({
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

  async handleUserDeleted(userData) {
    console.log("👤 Deleting user from Clerk");

    try {
      const clerkId = userData.id;

      const existingUser = await strapi.query("plugin::users-permissions.user").findOne({
        where: { clerkId },
      });

      if (!existingUser) {
        console.log("👤 User not found for deletion");
        return;
      }

      await strapi.query("plugin::users-permissions.user").delete({
        where: { id: existingUser.id },
      });

      console.log("✅ User deleted successfully");
    } catch (error) {
      console.error("💥 Error deleting user:", error);
      throw error;
    }
  },

  extractUserInfo(userData) {
    const { id, email_addresses, username, first_name, last_name, primary_email_address_id } = userData;

    const primaryEmail = email_addresses?.find(
      (email) => email.id === primary_email_address_id
    );

    return {
      clerkId: id,
      email: primaryEmail?.email_address || "",
      username: username || primaryEmail?.email_address?.split("@")[0] || "",
      firstName: first_name || "",
      lastName: last_name || "",
    };
  },

  async generateJWT(user) {
    return strapi.plugins["users-permissions"].services.jwt.issue({
      id: user.id,
      email: user.email,
    });
  },
};
