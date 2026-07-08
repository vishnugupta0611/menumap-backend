import mongoose from "mongoose";
import pino from "pino";
import { Restaurant } from "./models/Restaurant.js";
import { Category } from "./models/Category.js";
import { MenuItem } from "./models/MenuItem.js";
import { Staff } from "./models/Staff.js";
import { Review } from "./models/Review.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/menumap";
const imageBase = "https://lh3.googleusercontent.com/aida-public";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB for seeding");

    // Clear existing data
    await Restaurant.deleteMany({});
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    await Staff.deleteMany({});
    await Review.deleteMany({});

    logger.info("Cleared existing database records");

    // 1. Create Restaurants
    const r1 = await Restaurant.create({
      name: "Food Villa",
      slug: "food-villa",
      city: "kanpur",
      cuisine: "North Indian, Chinese, Continental",
      rating: 4.7,
      reviewsCount: 1286,
      distanceKm: 1.8,
      priceForTwo: 650,
      openNow: true,
      address: "117/K/13, Kakadeo, Kanpur",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      website: "https://foodvilla.com",
      heroImage: `${imageBase}/AB6AXuAsJUV9muXYjj_wfCQgSOY81hHdZqviDkGN6eREw7ymjWi107Taw8Q477ngBqDrq_04o1blMr5IkV5vR8mCSbrVKiiKjGjxhTaPXJHXFe-znSqzUiEb4Lc_UK9TwDcIzGOIyxF2Y6hIBwKJhCerUoenU3EUM2yMq5j7DraIzbCIwnETK2ScVnTe88nelc1ygUd5rb5MT_Yfr32rB37EaZs17iP3VcldDuKo8oDr4PibMTsp8SkLQe20`,
      logoImage: `${imageBase}/AB6AXuAnLmYvtLGulB_C0qG7HeCWj9KALsyzneycJD29dPg1Uc8ARtSc3PJsfU9Jb7Pv_cbqGtleg0lYW82O9_FIPSlF7YDja7emIAGIsh4GanXwBJBuMFM22q_szSfA06HX3nesz29YoMa6mgr8x5tf4M2nb7xxw6X3m_PjUid0_-8cAa_kPj6EgxMViCHtZYwcRdW2oRUxgQMeYRQa7PynNO8aPMkvu9LFMXMp5EWXMa4-7k-icn4_n_8Y`,
      facilities: ["AC", "Parking", "Family", "Delivery", "Cards", "Outdoor"],
      story: "A warm neighborhood restaurant built around searchable dishes, a living QR menu, and a public identity guests can trust before they arrive.",
      holidays: ["Mon"],
    });

    const r2 = await Restaurant.create({
      name: "The Greenhouse",
      slug: "the-greenhouse",
      city: "kanpur",
      cuisine: "Healthy Bowls, Cafe",
      rating: 4.5,
      reviewsCount: 642,
      distanceKm: 0.9,
      priceForTwo: 900,
      openNow: true,
      address: "Civil Lines, Kanpur",
      phone: "+91 91234 56780",
      whatsapp: "+91 91234 56780",
      website: "https://greenhouse.com",
      heroImage: `${imageBase}/AB6AXuA9iw9_RtfhPAXOCoLHPIaXcSzX6qpyhIoa1I1AfPPijd34hUj-5bP7BlhwnvXLUdguP6nxpUh30C-o6L4ZhTX3yQknjp304mr2KEyBpevXLuauAshcOfrXo0K7pEEZFXBlVAQ2TRHEKYEk3d4JJRA1eX98C6XdguLeFSCuGBUHA8naY_RgmfPkFHK66XUKR6-GLJKXg6qoLaMmiH5hJuBZXl820royAFYVpZBM9lqlva9pZArqok_4`,
      logoImage: `${imageBase}/AB6AXuAnLmYvtLGulB_C0qG7HeCWj9KALsyzneycJD29dPg1Uc8ARtSc3PJsfU9Jb7Pv_cbqGtleg0lYW82O9_FIPSlF7YDja7emIAGIsh4GanXwBJBuMFM22q_szSfA06HX3nesz29YoMa6mgr8x5tf4M2nb7xxw6X3m_PjUid0_-8cAa_kPj6EgxMViCHtZYwcRdW2oRUxgQMeYRQa7PynNO8aPMkvu9LFMXMp5EWXMa4-7k-icn4_n_8Y`,
      facilities: ["AC", "Family", "Delivery"],
      story: "Organic greens, farm-fresh local foods, and customized healthy salads in an aesthetic greenhouse setting.",
      holidays: [],
    });

    const r3 = await Restaurant.create({
      name: "The Olive Branch",
      slug: "the-olive-branch",
      city: "kanpur",
      cuisine: "Mediterranean, Bistro, Healthy",
      rating: 4.8,
      reviewsCount: 421,
      distanceKm: 1.2,
      priceForTwo: 1200,
      openNow: true,
      address: "Mall Road, Kanpur",
      phone: "+91 95432 10987",
      whatsapp: "+91 95432 10987",
      website: "https://olivebranch.com",
      heroImage: `${imageBase}/AB6AXuBIJj_oV6RW9josHPOpskwmAJm32fjZBPlplcoBpOQ3Vfd2CPxPwu5s4-f9B89yB_hScEMkZC2IoJdNrlPniCEGkSmvjDDG79-lANgX4SZaKLYVjwI096PnyopXg4cOnARcfVSjTNVRyzMyjhwSRRHUPFfPbnfZdHBneFQcVtav2GjlWMJDQpxwfuxGaJtHb6p3Cse2Qpde5GxaQ4O40gmw4hud8ctiHguX3AxQ22DBE4MoaMi0HZAO`,
      logoImage: `${imageBase}/AB6AXuAnLmYvtLGulB_C0qG7HeCWj9KALsyzneycJD29dPg1Uc8ARtSc3PJsfU9Jb7Pv_cbqGtleg0lYW82O9_FIPSlF7YDja7emIAGIsh4GanXwBJBuMFM22q_szSfA06HX3nesz29YoMa6mgr8x5tf4M2nb7xxw6X3m_PjUid0_-8cAa_kPj6EgxMViCHtZYwcRdW2oRUxgQMeYRQa7PynNO8aPMkvu9LFMXMp5EWXMa4-7k-icn4_n_8Y`,
      facilities: ["AC", "Parking", "Family", "Outdoor", "Cards"],
      story: "Experience fine Mediterranean dining, freshly baked artisanal sourdoughs, and grilled seafood in an elegant, airy bistro environment.",
      holidays: [],
    });

    const r4 = await Restaurant.create({
      name: "Umami Sushi",
      slug: "umami-sushi",
      city: "kanpur",
      cuisine: "Japanese, Sushi, Seafood",
      rating: 4.9,
      reviewsCount: 812,
      distanceKm: 0.8,
      priceForTwo: 1500,
      openNow: true,
      address: "Swaroop Nagar, Kanpur",
      phone: "+91 93456 78901",
      whatsapp: "+91 93456 78901",
      website: "https://umamisushi.com",
      heroImage: `${imageBase}/AB6AXuA2d38G8BpliV2O4rCXFiiKfE3MJEu_QDLg0iL0RLEqviFngcFzeb8z6RTFIBjo7S88OKxrRH4GMZ9NQGe7pd5bI-JuJ4-w4yzRqUvHjC8PPKKQYzPUyb4cAY5zfjhpeaD9_I3-amjcK9ZxximZaCfeHALpQGX98G_7CbKWchLp8lJR-WEObnRux5bMZ4FhsYFl2XqvYSiQWIV8XntBD8eVXZ4GFdRa9QFjmhftLAzsaBLFW-Ln17Cl`,
      logoImage: `${imageBase}/AB6AXuAnLmYvtLGulB_C0qG7HeCWj9KALsyzneycJD29dPg1Uc8ARtSc3PJsfU9Jb7Pv_cbqGtleg0lYW82O9_FIPSlF7YDja7emIAGIsh4GanXwBJBuMFM22q_szSfA06HX3nesz29YoMa6mgr8x5tf4M2nb7xxw6X3m_PjUid0_-8cAa_kPj6EgxMViCHtZYwcRdW2oRUxgQMeYRQa7PynNO8aPMkvu9LFMXMp5EWXMa4-7k-icn4_n_8Y`,
      facilities: ["AC", "Family", "Cards"],
      story: "Savor premium, fresh sashimi, meticulously prepared rolls, and curated Japanese fusion entrees under low-key mood lighting.",
      holidays: ["Mon"],
    });

    logger.info("Seeded restaurants");

    // 2. Create Categories
    const catStarters = await Category.create({ name: "Starters", restaurantId: r1._id, sortOrder: 1 });
    const catMains = await Category.create({ name: "Main Course", restaurantId: r1._id, sortOrder: 2 });
    const catChinese = await Category.create({ name: "Chinese", restaurantId: r1._id, sortOrder: 3 });
    const catBowls = await Category.create({ name: "Bowls", restaurantId: r2._id, sortOrder: 1 });

    logger.info("Seeded categories");

    // 3. Create Menu Items
    await MenuItem.create([
      {
        name: "Paneer Tikka",
        description: "Smoky tandoor paneer with peppers, onion, and mint chutney.",
        price: 220,
        veg: true,
        popular: true,
        rating: 4.8,
        image: `${imageBase}/AB6AXuAbpvQcYJRO2LpXRK-AAL6Ss-AaydV8mJqOkOn0lMEqzg_FbeMyvLVd9N_LLUJz6-1WoiF8FofCWHVtp_mkMY3KekuyQw7vhnpJodLrTr9IyMAxP1oYlxmv145hNFJUy4JLQqc4jVYWPHhu_3LbR3ztLDJVR-QGVuF2RUNs-NH0IIN4EUKd0g4BLWJ9vfp-LYPLJ-WM3D9Cp1RoVJR8OVRgORSxQoHoBt6ZuGlOU2DfksrJ1WyufbhZ`,
        categoryId: catStarters._id,
        category: "Starters",
        restaurantId: r1._id,
      },
      {
        name: "Butter Chicken",
        description: "Creamy tomato gravy, charred chicken, kasuri methi.",
        price: 360,
        veg: false,
        popular: true,
        rating: 4.9,
        image: `${imageBase}/AB6AXuCEFg-vChTtj1fp4DJTOGJl1TpeVxhWsiihXUr8RmwK7d6a7O8nVM9sg6g-qeQuoYALHoIK9Ld9r6LvFh7xwm6Fcv9vot2aq14RRf5LFnNPLV0iEQVOLWws_lXs4zR0uqln3cNNdrSGN91_DqUdY6sSfiyoxaZ_CIit-7Ag1T34lnt-gyr1n__CPElq50sm2T1fOvyBvj6zzZmig_ajm1wAAzbGALaMriPK9hnUum21hBDCL7qmxgoa`,
        categoryId: catMains._id,
        category: "Main Course",
        restaurantId: r1._id,
      },
      {
        name: "Veg Hakka Noodles",
        description: "Wok tossed noodles with fresh vegetables.",
        price: 180,
        veg: true,
        popular: false,
        rating: 4.4,
        image: `${imageBase}/AB6AXuBHWixsUDjvwh6aK1m-XnNbshHbZ28edD_b0dFIRClrmpz1SWANE4RDlgR5ICYgPfRm5Oif7KEL4h3GtxutZSk-JD2IrHS4_hcSWj-KHN5N-fWDgoluOUc-idBU_j5_xQvi1iNoQfXdbTyTZ_r2xsjI3LZ_RH6J0cnD3B07-jDsfLw4phBA2Ep3N5-rfr3P59iILBeKAO2MGsnntJlKtJYDGoKUTXDRuR5_zt_TRBK6274icCNNXYYR`,
        categoryId: catChinese._id,
        category: "Chinese",
        restaurantId: r1._id,
      },
      {
        name: "Terra Harvest Bowl",
        description: "Roasted vegetables, greens, grains, and house sauce.",
        price: 310,
        veg: true,
        popular: true,
        rating: 4.7,
        image: `${imageBase}/AB6AXuAsJUV9muXYjj_wfCQgSOY81hHdZqviDkGN6eREw7ymjWi107Taw8Q477ngBqDrq_04o1blMr5IkV5vR8mCSbrVKiiKjGjxhTaPXJHXFe-znSqzUiEb4Lc_UK9TwDcIzGOIyxF2Y6hIBwKJhCerUoenU3EUM2yMq5j7DraIzbCIwnETK2ScVnTe88nelc1ygUd5rb5MT_Yfr32rB37EaZs17iP3VcldDuKo8oDr4PibMTsp8SkLQe20`,
        categoryId: catBowls._id,
        category: "Bowls",
        restaurantId: r2._id,
      },
    ]);

    logger.info("Seeded menu items");

    // 4. Create Staff Members
    await Staff.create([
      {
        name: "Marcus Aurelius",
        role: "Chef",
        status: "Active",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjTAp-0ECf7CsHeRoQn-yR15msP0reeT86T07URkA-tYpswaWqWxoN_Rzrwt__yqvzjvaqbMVFFr_T-UHgQKdUuZb8jnpkk_Xwsl075lQrwhAoeSgoSX5sDgv7h2sRbHi-88pR-eSBIzGkyCre5Ngg_kb2t1wRXzz4WowPJRGkNzhiIvlfBIcTRiJHWp507-2HJVHEHFL3iInZgplA_j68ZITjJRZyXsH0bcp_QfeWYsjV9F7ADZWR",
        permissions: "Full Kitchen & Menu Access",
        email: "chef.marcus@menumap.com",
        restaurantId: r1._id,
      },
      {
        name: "Sophia Lorenz",
        role: "Admin",
        status: "Active",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnLmYvtLGulB_C0qG7HeCWj9KALsyzneycJD29dPg1Uc8ARtSc3PJsfU9Jb7Pv_cbqGtleg0lYW82O9_FIPSlF7YDja7emIAGIsh4GanXwBJBuMFM22q_szSfA06HX3nesz29YoMa6mgr8x5tf4M2nb7xxw6X3m_PjUid0_-8cAa_kPj6EgxMViCHtZYwcRdW2oRUxgQMeYRQa7PynNO8aPMkvu9LFMXMp5EWXMa4-7k-icn4_n_8Y",
        permissions: "Billing, Settings & Staff Admin",
        email: "sophia@menumap.com",
        restaurantId: r1._id,
      },
    ]);

    // 5. Create Reviews
    await Review.create([
      {
        name: "Riya S.",
        rating: 5,
        text: "QR menu opened instantly and the paneer tikka was exactly what I searched for.",
        restaurantId: r1._id,
      },
      {
        name: "Aman V.",
        rating: 5,
        text: "Loved seeing dishes first instead of scrolling restaurants blindly.",
        restaurantId: r1._id,
      },
    ]);

    logger.info("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Seeding failed");
    process.exit(1);
  }
}

seed();
