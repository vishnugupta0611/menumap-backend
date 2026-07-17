import mongoose from "mongoose";
import dotenv from "dotenv";
import { createClerkClient } from "@clerk/backend";

// Load environment variables
dotenv.config({ path: ".env" });

// Import Models
import { User } from "../src/models/User.js";
import { Restaurant } from "../src/models/Restaurant.js";
import { Staff } from "../src/models/Staff.js";
import { Category } from "../src/models/Category.js";
import { MenuItem } from "../src/models/MenuItem.js";
import { Order } from "../src/models/Order.js";
import { GalleryAsset } from "../src/models/GalleryAsset.js";
import { Review } from "../src/models/Review.js";
import { Offer } from "../src/models/Offer.js";
import slugify from "slugify";

const MONGODB_URI = process.env.MONGODB_URI;
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const MOCK_RESTAURANTS = [
  {
    name: "Tandoori Nights Prayagraj",
    city: "Prayagraj",
    cuisine: "North Indian, Mughlai",
    address: "Civil Lines, Prayagraj",
    lat: 25.4500, lng: 81.8400,
    heroImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1600&auto=format&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=200&auto=format&fit=crop",
    email: "admin1@tandoorinights.com",
    password: "MenuMap@Restro2026!",
    uiSettings: { layout: "bento", heroImageLayout: "full-width" }
  },
  {
    name: "The Kanpur Cafe",
    city: "Kanpur",
    cuisine: "Cafe, Fast Food, Beverages",
    address: "Swaroop Nagar, Kanpur",
    lat: 26.4499, lng: 80.3319,
    heroImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1600&auto=format&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=200&auto=format&fit=crop",
    email: "admin2@kanpurcafe.com",
    password: "MenuMap@Restro2026!",
    uiSettings: { layout: "grid", heroImageLayout: "rounded" }
  },
  {
    name: "Sangam Sweets & Snacks",
    city: "Prayagraj",
    cuisine: "Sweets, South Indian",
    address: "Chowk, Prayagraj",
    lat: 25.4358, lng: 81.8463,
    heroImage: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1600&auto=format&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1589302168068-96516f1964f5?q=80&w=200&auto=format&fit=crop",
    email: "admin3@sangamsweets.com",
    password: "MenuMap@Restro2026!",
    uiSettings: { layout: "simple-list", heroImageLayout: "square" }
  },
  {
    name: "Nawab's Biryani",
    city: "Kanpur",
    cuisine: "Biryani, Lucknowi",
    address: "Mall Road, Kanpur",
    lat: 26.4600, lng: 80.3500,
    heroImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1600&auto=format&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1606491956689-2ea866880c8e?q=80&w=200&auto=format&fit=crop",
    email: "admin4@nawabsbiryani.com",
    password: "MenuMap@Restro2026!",
    uiSettings: { layout: "list", heroImageLayout: "rounded" }
  },
  {
    name: "Global Fusion Kanpur",
    city: "Kanpur",
    cuisine: "Continental, Italian, Chinese",
    address: "Kakadeo, Kanpur",
    lat: 26.4700, lng: 80.3000,
    heroImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1600&auto=format&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop",
    email: "admin5@globalfusion.com",
    password: "MenuMap@Restro2026!",
    uiSettings: { layout: "bento", heroImageLayout: "full-width" }
  }
];

const MOCK_CATEGORIES = ["Starters", "Main Course", "Desserts"];
const FOOD_IMAGE = "https://images.unsplash.com/photo-1606491956689-2ea866880c8e?q=80&w=800&auto=format&fit=crop";

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    // 1. Delete all MongoDB data
    console.log("Wiping all MongoDB collections...");
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Staff.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      Order.deleteMany({}),
      GalleryAsset.deleteMany({}),
      Review.deleteMany({}),
      Offer.deleteMany({})
    ]);
    console.log("MongoDB collections wiped.");

    // 2. Delete all Clerk users
    console.log("Fetching Clerk users...");
    const userList = await clerkClient.users.getUserList();
    if (userList.data && userList.data.length > 0) {
      console.log(`Deleting ${userList.data.length} Clerk users...`);
      for (const u of userList.data) {
        await clerkClient.users.deleteUser(u.id);
      }
      console.log("Clerk users wiped.");
    } else {
      console.log("No Clerk users found to delete.");
    }

    // 3. Create mock users and restaurants
    console.log("Seeding new mock restaurants...");
    const credentials = [];

    for (const mock of MOCK_RESTAURANTS) {
      // Create Clerk User
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [mock.email],
        password: mock.password,
        firstName: mock.name.split(" ")[0]
      });

      // Create Mongo User
      const user = await User.create({
        name: mock.name,
        email: mock.email,
        clerkId: clerkUser.id,
        role: "owner"
      });

      // Create Restaurant
      const restaurant = await Restaurant.create({
        ownerId: user._id,
        name: mock.name,
        slug: slugify(mock.name + "-" + Date.now(), { lower: true }),
        city: mock.city,
        cuisine: mock.cuisine,
        address: mock.address,
        location: { lat: mock.lat, lng: mock.lng },
        heroImage: mock.heroImage,
        logoImage: mock.logoImage,
        menuUiSettings: {
          showTabs: true,
          showImage: true,
          showDescription: true,
          showBanner: true,
          heroImageLayout: mock.uiSettings.heroImageLayout,
          layout: mock.uiSettings.layout,
          galleryLayout: "grid"
        },
        socialLinks: { instagram: "https://instagram.com", facebook: "https://facebook.com" },
        facilities: ["AC", "Free WiFi", "Parking"]
      });

      // Update User with restaurant ID
      user.restaurantId = restaurant._id;
      await user.save();

      // Create Gallery for the first two restaurants
      if (mock.name.includes("Tandoori") || mock.name.includes("Kanpur Cafe")) {
        await GalleryAsset.insertMany([
          { restaurantId: restaurant._id, url: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6", alt: "Dining space", type: "gallery" },
          { restaurantId: restaurant._id, url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", alt: "Special Dish", type: "gallery" }
        ]);
      }

      // Create Categories and Menu Items
      for (const catName of MOCK_CATEGORIES) {
        const cat = await Category.create({
          restaurantId: restaurant._id,
          name: catName,
          type: "food"
        });

        // 3 items per category
        for (let i = 1; i <= 3; i++) {
          await MenuItem.create({
            restaurantId: restaurant._id,
            categoryId: cat._id,
            category: catName,
            name: `${catName} Item ${i}`,
            description: `Delicious ${catName.toLowerCase()} served fresh.`,
            price: Math.floor(Math.random() * 300) + 100,
            image: FOOD_IMAGE,
            veg: Math.random() > 0.5,
            available: true
          });
        }
      }

      credentials.push({ email: mock.email, password: mock.password });
      console.log(`Created restaurant: ${mock.name}`);
    }

    console.log("\n==============================");
    console.log("SUCCESS! Here are the credentials:");
    console.table(credentials);
    console.log("==============================\n");

  } catch (error) {
    console.error("Error during reset and seed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
