export const FIGHTER_COUNTRIES = {
  // UFC Fight Night Nov 22, 2025
  "Arman Tsarukyan": "am",
  "Dan Hooker": "nz",
  "Belal Muhammad": "ps",
  "Ian Machado Garry": "ie",
  "Volkan Oezdemir": "ch",
  "Alonzo Menifield": "us",
  "Jack Hermansson": "no",
  "Myktybek Orolbai": "kg",
  "Serghei Spivac": "md",
  "Shamil Gaziev": "bh",
  "Alex Perez": "us",
  "Asu Almabayev": "kz",
  "Bogdan Grad": "at",
  "Luke Riley": "us",
  "Abdulrakhman Yakhyaev": "ru",
  "Rafael Cerqueira": "br",
  "Tagir Ulanbekov": "ru",
  "Kyoji Horiguchi": "jp",
  "Bekzat Almakhan": "kz",
  "Aleksandre Topuria": "ge",
  "Ismail Naurdiev": "ma",
  "Ryan Loder": "us",
  "Nurullo Aliev": "tj",
  "Shem Rock": "us",
  "Nicolas Dalby": "dk",
  "Saygid Izagakhmaev": "ru",
  "Marek Bujlo": "pl",
  "Denzel Freeman": "us",
  
  // UFC 323
  "Merab Dvalishvili": "ge",
  "Petr Yan": "ru",
  "Alexandre Pantoja": "br",
  "Joshua Van": "mm",
  "Jan Blachowicz": "pl",
  "Jan Błachowicz": "pl",
  "Bogdan Guskov": "uz",
  "Brandon Moreno": "mx",
  "Tatsuro Taira": "jp",
  "Muhammad Naimov": "tj",
  "Mairon Santos": "br",
  "Henry Cejudo": "us",
  "Payton Talbott": "us",
  "Marvin Vettori": "it",
  "Brunno Ferreira": "br",
  "Maycee Barber": "us",
  "Karine Silva": "br",
  "Edson Barboza": "br",
  "Jalin Turner": "us",
  "Iwo Baraniewski": "pl",
  "Ibo Aslan": "tr",
  "Grant Dawson": "us",
  "Manuel Torres": "mx",
  "Terrance McKinney": "us",
  "Chris Duncan": "gb",
  "Mansur Abdul-Malik": "us",
  "Antonio Trocoli": "br",
  "Nazim Sadykhov": "az",
  "Fares Ziam": "fr",
  "Farès Ziam": "fr",
  
  // UFC Fight Night Dec 13, 2025
  "Brandon Royval": "us",
  "Manel Kape": "pt",
  "Giga Chikadze": "ge",
  "Kevin Vallejos": "ar",
  "Kennedy Nzechukwu": "ng",
  "Marcus Buchecha": "br",
  "Joanderson Brito": "br",
  "Melsik Baghdasaryan": "am",
  "Amanda Lemos": "br",
  "Gillian Robertson": "ca",
  "Melquizael Costa": "br",
  "Morgan Charriere": "fr",
  "Cesar Almeida": "br",
  "Cezary Oleksiejczuk": "pl",
  "Melissa Croden": "ca",
  "Luana Santos": "br",
  "Jamey-Lyn Horth": "ca",
  "Tereza Bleda": "cz",
  
  // Additional fighters
  "Steve Garcia": "us",
  "David Onama": "ug",
  "Waldo Cortes-Acosta": "do",
  "Ante Delija": "hr",
  "Jeremiah Wells": "us",
  "Themba Gorimbo": "zw",
  "Isaac Dulgarian": "cu",
  "Yadier Delvalle": "pr",
  "Sean Brady": "us",
  "Randy Brown": "us",
  "Beneil Dariush": "ir",
  "Carlos Prates": "br",
  "Muslim Salikhov": "ru",
  "Denise Gomes": "br",
  "Angela Hill": "us",
  "Jacqueline Cavalcanti": "br",
  "Bo Nickal": "us",
  "Paul Craig": "gb",
  "Islam Makhachev": "ru",
  "Charles Oliveira": "br",
  "Zhang Weili": "cn",
  "Valentina Shevchenko": "kg",
  "Leon Edwards": "gb",
  "Colby Covington": "us",
  "Alexander Volkanovski": "au",
  "Ilia Topuria": "ge",
};

export function getFighterCountry(fighterName) {
  if (!fighterName) return "us";
  
  const normalized = fighterName.trim();
  
  if (FIGHTER_COUNTRIES[normalized]) {
    return FIGHTER_COUNTRIES[normalized];
  }
  
  const lowerName = normalized.toLowerCase();
  for (const [name, code] of Object.entries(FIGHTER_COUNTRIES)) {
    if (name.toLowerCase() === lowerName) {
      return code;
    }
  }
  
  const withoutAccents = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  if (FIGHTER_COUNTRIES[withoutAccents]) {
    return FIGHTER_COUNTRIES[withoutAccents];
  }
  
  return "us";
}