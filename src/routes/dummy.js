import express from "express";

export const dummyRouter = express.Router();

const dummyRestaurants = [
  {
    "restaurantName": "Krazy Panda Cafe & Veg Restaurant",
    "ownerName": "Not Available (Not public on Maps)",
    "mobileNumber": "096966 44054",
    "rating": "4.8",
    "imageUrls": [
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlI2dE3U0Obr9XgEdtgM5NeT8HZufoEqVMOVAqI7xhHuRzeXXpcfZ3q26zPZl0kkd12ayeB2ylGlcnKDp1VB45C7wgz9H78tgAYqfGmnH-v_d6mLZzRPrNy0UQ-a2-xC3QgrY_c9uX1tQAl=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlsYHgp9rNsj_uoSWzmfpMNq2qTZR24F5WzIHDWA9r3wSmDXToCrnwx63jfV4nG9TBMmNtPvudEYksInNK8xmmklrcYsNo9RqSunvt_P7xKa902Jxfyj8gNa-ERzt8630WKwzaaA-WTFLW-=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlWqAV__OxqjBAvzEdpPPBg48MInBCaVg8_tff0iGG9cq30A7MV7pG22iAT8XCMjmDzG6iIy8e54J4but4kWQ4-dBVp-gQ6SZvVirH6knMHN9S5jLPhhia_BVz9cSDpT05cOn7M=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk2j9vFWJWOX2pgc7lB5dJM2lSI7CUuvGAs4O1kOFbUgFUMdOi43eEsrbW4JQ-AElJjFE93aANsilRDhBL-K9fzHQvld7Euwsg8RUQC911kDYgAbEGqei_vmDx27AXwxRoGOBU=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmQvgbnOldRZaMet-2IYXCWfQx35SAHihm6fYAKPu0uq_wSYxzN_CxDk8iu7-LmV9jwLIiyHxLlcEYKl2axBElf-_2fyGJuC1lSSyqfTtdSNljAVQym7Tr8cDw8-z3RHOl5z4OpVQ=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmj04QSvlA1Vtl0KVRmWtJE8-dn3f4o1Qe5r42Mri3NTKk8WGNd4Jv6UOYamEmX_wOb92FxzjUq7bQdrMkkZYJoneZmdDrC1dSOMwoJyNevaARHm9rg3F7PEpErypV51pYMTrrIxQ=s0"
    ],
    "location": "17/23A, Shiv Ram Das Gulati Marg, Manmohan Park, Old Katra, Prayagraj, Uttar Pradesh 211002",
    "searchQuery": "restaurant in prayagraj"
  },
  {
    "restaurantName": "Sardaar Ji Dhaba - Prayagraj",
    "ownerName": "Not Available (Not public on Maps)",
    "mobileNumber": "088828 97431",
    "rating": "4.2",
    "imageUrls": [
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlTOdO7-qdckaIk9sXrVVO6-zDHEPhTm2xvmztf4wzhQ0otYFnLf7DW6kk8nxnzLHR_lq85XAtRnC4wl2NtSXScdUxUirgCiqs-4bzLelbhOBhgK24xyy2rrf83p9yFn0fBpDI4nQ=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmwiX9N_-HO9Eagx-yEqlj4YSWQr5iPcpI5nKMqwHY2XK6b2bPzmhrJETwOfesTpOSpXVRzGybZ5lv5ODLSp5MHCVtNFDfCKEHNoJQoVSF01fFE_ul_pyleq8ofmSDxFwKfsM4G-CCeRis=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmO88iVi19Y7f5vajGChSPOaaMOfNXnmJsPTkj8A8jdyh9oZCVSKusc-xhiNOCe0ZgSKUcR3rTwpj8WXT9tjMRfRftzhVVZGE9fOdV_SXMUcOLQli1INNuH5x8cj09csx4bTFL9SA=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnKdxLUDPz9Y3u4NV7PTx4RSzFlbxSWmxlVn9N0V_1_FoArKggwVNqCjHd7672ktNKmO5cI7f6RjthqBn-sa626ezQ0dNdawaV26_5fYTas1HaoRwhuOpwheI0QoV7cdIOzJM4=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkuY0izwmD2bIZ_u_PZ7A7_nmc7vOkfAXiBdjdHTd4JpVn5iqZ_xnvDtQ-8vyUsD0sZwc_QxQ4rS_LyP8_VwPfX0PcnTJ9HrAIRe41IL_srQMRp0rGjH5kZt9au7g1Xv_SsXHi3bkT237m6=s0",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlrtoxwWPPHhYBb3p1XdkM3UHxk28w7n18QrLtsZJItx3is1LmIirKeHzgPJxKfpT-22rtnoK0ifT7aIs2kyIYVRdNZOz5JjIRHJ8frd4HnIgUrIUz-_VQiXJdy2N4FLaL5zBfccA=s0"
    ],
    "location": "138C, Mahatma Gandhi Marg, near El Chico, Civil Lines, Prayagraj, Uttar Pradesh 211001",
    "searchQuery": "restaurant in prayagraj"
  }
];

dummyRouter.get("/", (req, res) => {
  const number = req.query.number;
  if (!number) {
    return res.status(400).json({ success: false, message: "Number is required" });
  }

  const rawData = dummyRestaurants.find(r => r.mobileNumber.replace(/\s+/g, '') === number.replace(/\s+/g, ''));
  
  if (!rawData) {
    return res.status(404).json({ success: false, message: "Restaurant not found" });
  }

  const restaurant = {
    _id: "dummy_res_1",
    name: rawData.restaurantName,
    city: "dummy",
    slug: "dummy",
    phone: rawData.mobileNumber,
    address: rawData.location,
    rating: parseFloat(rawData.rating),
    heroImage: rawData.imageUrls[0],
    logoImage: "https://img.freepik.com/premium-vector/restaurant-logo-design-template_79169-56.jpg",
    story: "Welcome to " + rawData.restaurantName + ". This is a preview generated just for you. Take a look at our amazing menu and facilities!",
    cuisine: "Multi-Cuisine",
    openNow: true,
    priceForTwo: 500,
    facilities: ["Free WiFi", "AC", "Outdoor Seating", "Parking Available"],
    website: "https://example.com",
    socialLinks: {
      instagram: "https://instagram.com/dummy",
      facebook: "https://facebook.com/dummy",
      x: "https://x.com/dummy"
    },
    menuUiSettings: {
      colorPalette: "clay",
      font: "jakarta",
      layout: "bento",
      showBanner: true,
      showDescription: true,
      showBadges: true,
      showImage: true,
      galleryLayout: "aesthetic",
      showTabs: true
    }
  };

  const gallery = rawData.imageUrls.map((url, index) => ({
    _id: "gal_" + index,
    url: url,
    caption: `Gallery image ${index + 1}`
  }));

  const reviews = [
    { _id: "rev1", name: "Rahul Singh", rating: 5, text: "Amazing food and great ambiance!", createdAt: new Date().toISOString() },
    { _id: "rev2", name: "Priya Sharma", rating: 4, text: "Loved the starters, will visit again.", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: "rev3", name: "Aman Gupta", rating: 5, text: "Best place in town!", createdAt: new Date(Date.now() - 172800000).toISOString() }
  ];

  const menu = [
    { _id: "menu1", name: "Classic Paneer Tikka", description: "Soft paneer marinated with Indian spices", price: 250, category: "Starters", popular: true, veg: true, image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { _id: "menu2", name: "Chicken Biryani", description: "Aromatic basmati rice cooked with tender chicken", price: 350, category: "Mains", popular: true, veg: false, image: "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { _id: "menu3", name: "Butter Naan", description: "Soft Indian bread glazed with butter", price: 50, category: "Breads", popular: false, veg: true, image: "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=400" },
    { _id: "menu4", name: "Chocolate Brownie", description: "Warm chocolate brownie with a scoop of vanilla ice cream", price: 180, category: "Desserts", popular: true, veg: true, image: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400" }
  ];

  res.json({
    success: true,
    data: {
      restaurant,
      gallery,
      reviews,
      menu
    }
  });
});
