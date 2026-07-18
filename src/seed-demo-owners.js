import "dotenv/config";
import mongoose from "mongoose";
import pino from "pino";
import slugify from "slugify";
import { User } from "./models/User.js";
import { Restaurant } from "./models/Restaurant.js";

const logger = pino({ level: "info" });

const DEMO_OWNERS = [
  {
    name: "Tandoori Nights Owner",
    email: "admin1@tandoorinights.com",
    password: "Vishnu@$89890",
    restaurantName: "Tandoori Nights",
    city: "kanpur",
    cuisine: "North Indian, Tandoor",
    lat: 26.4499,
    lng: 80.3319,
  },
  {
    name: "Kanpur Cafe Owner",
    email: "admin2@kanpurcafe.com",
    password: "Vishnu@$89890",
    restaurantName: "Kanpur Cafe",
    city: "kanpur",
    cuisine: "Cafe, Snacks, Beverages",
    lat: 26.4500,
    lng: 80.3320,
  },
  {
    name: "Sangam Sweets Owner",
    email: "admin3@sangamsweets.com",
    password: "Vishnu@$89890",
    restaurantName: "Sangam Sweets",
    city: "kanpur",
    cuisine: "Sweets, Mithai, Namkeen",
    lat: 26.4501,
    lng: 80.3321,
  },
  {
    name: "Nawabs Biryani Owner",
    email: "admin4@nawabsbiryani.com",
    password: "Vishnu@$89890",
    restaurantName: "Nawabs Biryani",
    city: "kanpur",
    cuisine: "Biryani, Mughlai, Kebabs",
    lat: 26.4502,
    lng: 80.3322,
  },
  {
    name: "Global Fusion Owner",
    email: "admin5@globalfusion.com",
    password: "Vishnu@$89890",
    restaurantName: "Global Fusion",
    city: "kanpur",
    cuisine: "Continental, Asian, Indian",
    lat: 26.4503,
    lng: 80.3323,
  },
];

async function seedDemoOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/menumap");
    logger.info("Connected to MongoDB");

    for (const owner of DEMO_OWNERS) {
      // Skip if email already exists
      const existing = await User.findOne({ email: owner.email });
      if (existing) {
        logger.info(`Skipping ${owner.email} — already exists`);
        continue;
      }

      // Generate unique slug
      let slug = slugify(owner.restaurantName, { lower: true, strict: true });
      let counter = 1;
      while (await Restaurant.findOne({ slug })) {
        slug = `${slugify(owner.restaurantName, { lower: true, strict: true })}-${counter}`;
        counter++;
      }

      // Create restaurant
      const restaurant = await Restaurant.create({
        name: owner.restaurantName,
        slug,
        city: owner.city,
        cuisine: owner.cuisine,
        address: `${owner.city}, India`,
        openNow: true,
        location: { lat: owner.lat, lng: owner.lng },
      });

      // Create user (password will be hashed by pre-save hook)
      const user = await User.create({
        name: owner.name,
        email: owner.email,
        password: owner.password,
        role: "owner",
        restaurantId: restaurant._id,
      });

      // Link ownerId back to restaurant
      restaurant.ownerId = user._id;
      await restaurant.save();

      logger.info(`Created: ${owner.email} → ${owner.restaurantName} (${slug})`);
    }

    logger.info("Demo owners seeded successfully");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Seeding failed");
    process.exit(1);
  }
}

seedDemoOwners();
