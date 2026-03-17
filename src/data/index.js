export const PRODUCTS = [
  {id:1,  name:"Aqua Galon 19L",          price:22000, desc:"Air mineral berkualitas tinggi dalam kemasan galon 19L. Segar dan bersih untuk keluarga.",                              img:"https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&h=500&fit=crop", stock:50,  cat:"Minuman",          sold:320, rating:4.9},
  {id:2,  name:"Teh Botol Sosro 450ml",   price:5000,  desc:"Teh manis segar dalam botol 450ml. Rasa original ikonik yang selalu menyegarkan kapan saja.",                          img:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=500&fit=crop", stock:100, cat:"Minuman",          sold:580, rating:4.8},
  {id:3,  name:"Indomie Goreng (Pack 5)", price:16000, desc:"Mie instan goreng terpopuler Indonesia. Pack 5 bungkus, praktis dan ekonomis.",                                         img:"https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&h=500&fit=crop", stock:80,  cat:"Makanan Instan",   sold:410, rating:4.9},
  {id:4,  name:"Chitato Sapi Panggang",   price:12000, desc:"Keripik kentang rasa sapi panggang yang gurih dan renyah. Cemilan favorit semua kalangan.",                             img:"https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&h=500&fit=crop", stock:60,  cat:"Snack",            sold:290, rating:4.7},
  {id:5,  name:"Sabun Lifebuoy 100g",     price:8500,  desc:"Sabun mandi antibakteri melindungi dari kuman. Wangi segar tahan lama sepanjang hari.",                                 img:"https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=500&h=500&fit=crop", stock:120, cat:"Kebutuhan Harian", sold:210, rating:4.6},
  {id:6,  name:"Coca-Cola 330ml (6 Pcs)", price:35000, desc:"Minuman bersoda segar dalam kaleng 330ml. Pack 6 kaleng, hemat dan praktis.",                                           img:"https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop", stock:45,  cat:"Minuman",          sold:175, rating:4.8},
  {id:7,  name:"Pop Mie Ayam 75g",        price:4500,  desc:"Mie cup instan rasa ayam lezat. Tambah air panas, siap 3 menit.",                                                       img:"https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&h=500&fit=crop", stock:90,  cat:"Makanan Instan",   sold:390, rating:4.7},
  {id:8,  name:"Oreo Original 137g",      price:18000, desc:"Biskuit sandwich krim vanilla kesukaan semua kalangan. Renyah, manis, sempurna.",                                        img:"https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&h=500&fit=crop", stock:55,  cat:"Snack",            sold:260, rating:4.8},
  {id:9,  name:"Shampo Pantene 170ml",    price:22000, desc:"Shampo perawatan rambut formula Pro-V. Rambut lebih kuat, sehat, dan berkilau.",                                         img:"https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop", stock:40,  cat:"Kebutuhan Harian", sold:145, rating:4.6},
  {id:10, name:"Kopi Kapal Api 165g",     price:19500, desc:"Kopi bubuk cita rasa kuat dan harum. Sempurna untuk memulai pagi Anda.",                                                 img:"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop", stock:75,  cat:"Minuman",          sold:340, rating:4.9},
];

export const CATEGORIES = ["Semua","Minuman","Snack","Makanan Instan","Kebutuhan Harian"];
export const CAT_ICON   = {Semua:"🏪",Minuman:"🥤",Snack:"🍿","Makanan Instan":"🍜","Kebutuhan Harian":"🛁"};
export const ONGKIR     = {Jakarta:10000,Bogor:15000,Depok:15000,Tangerang:15000,Bekasi:15000,Lainnya:25000};

export const ACCOUNTS = [
  {id:1, username:"owner",  password:"owner123",  name:"Budi Santoso",   role:"owner", avatar:"BS"},
  {id:2, username:"staf1",  password:"staf123",   name:"Rina Wulandari", role:"staff", avatar:"RW"},
  {id:3, username:"staf2",  password:"staf456",   name:"Dani Pratama",   role:"staff", avatar:"DP"},
];
