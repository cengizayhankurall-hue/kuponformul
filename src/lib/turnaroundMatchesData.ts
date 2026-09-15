export interface TurnaroundMatch {
  id: string;
  code?: string;
  date: string;
  time: string;
  month: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  iyScore: string;
  msScore: string;
  type: '1/2' | '2/1';
  odds: {
    ms1: string;
    msX: string;
    ms2: string;
    iy1?: string;
    iyX?: string;
    iy2?: string;
    turnaroundOdd: string;
    kgVar?: string;
    alt25?: string;
    ust25?: string;
  };
  details?: {
    minuteOfWinner?: string;
    redCard?: boolean;
    note?: string;
  };
}

export const TURNAROUND_MATCHES: TurnaroundMatch[] = [
  {
    "id": "a8ada8d5-5e0b-4788-ac2f-af3b225569de",
    "date": "14.09.2026",
    "time": "01:05",
    "month": "Eylül 2026",
    "league": "JAM",
    "country": "JAM",
    "homeTeam": "Molynes United",
    "awayTeam": "Treasure Beach",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.73",
      "msX": "2.73",
      "ms2": "3.75",
      "turnaroundOdd": "23.39",
      "kgVar": "1.62",
      "ust25": "1.79"
    },
    "details": {
      "note": "Molynes United ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "8479c80f-ec4a-4532-9ee4-9254e0f74bc8",
    "date": "14.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İSÇ2",
    "country": "İSÇ2",
    "homeTeam": "Norrby",
    "awayTeam": "Varbergs",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.58",
      "msX": "3.02",
      "ms2": "2.03",
      "turnaroundOdd": "26.84",
      "kgVar": "1.40",
      "ust25": "1.50"
    },
    "details": {
      "note": "Varbergs ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "97441aff-1cec-4a45-b656-30c04d552f5a",
    "date": "14.09.2026",
    "time": "19:30",
    "month": "Eylül 2026",
    "league": "RUS1",
    "country": "RUS1",
    "homeTeam": "Veles",
    "awayTeam": "Pfc Sochi",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.12",
      "msX": "2.84",
      "ms2": "1.86",
      "turnaroundOdd": "24.89",
      "kgVar": "1.66",
      "ust25": "1.86"
    },
    "details": {
      "note": "Pfc Sochi ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8583a89f-75d4-49bc-8943-7684ebdd619c",
    "date": "14.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "ALKB",
    "country": "ALKB",
    "homeTeam": "Bayer Leverkus",
    "awayTeam": "Bayern München",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "6.64",
      "msX": "4.91",
      "ms2": "1.16",
      "turnaroundOdd": "16.84",
      "kgVar": "1.42",
      "ust25": "1.37"
    },
    "details": {
      "note": "Bayern München ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "40740923-9d10-4627-8740-100e4147e4ee",
    "date": "13.09.2026",
    "time": "17:55",
    "month": "Eylül 2026",
    "league": "BAE2",
    "country": "BAE2",
    "homeTeam": "Dubba Al Husun",
    "awayTeam": "Palm City 365",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.79",
      "msX": "3.52",
      "ms2": "2.70",
      "turnaroundOdd": "34.55",
      "kgVar": "1.28",
      "ust25": "1.38"
    },
    "details": {
      "note": "Palm City 365 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "185378ed-4683-4a46-ba58-9089cce23d1e",
    "date": "13.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "İS4",
    "country": "İS4",
    "homeTeam": "Dep. Guadalaja",
    "awayTeam": "Rsd Alcala",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.79",
      "msX": "2.99",
      "ms2": "3.15",
      "turnaroundOdd": "24.09",
      "kgVar": "1.65",
      "ust25": "1.80"
    },
    "details": {
      "note": "Dep. Guadalaja ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "8b5bd883-bba0-439b-a12f-c1755be5e9f7",
    "date": "13.09.2026",
    "time": "18:08",
    "month": "Eylül 2026",
    "league": "GANA",
    "country": "GANA",
    "homeTeam": "Bibiani Gold S",
    "awayTeam": "Hearts Of Oak",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.10",
      "msX": "2.55",
      "ms2": "2.92",
      "turnaroundOdd": "37.08",
      "kgVar": "1.93",
      "ust25": "2.09"
    },
    "details": {
      "note": "Hearts Of Oak ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "96a3105d-13cc-4c66-bdf2-08ab63b385aa",
    "date": "13.09.2026",
    "time": "18:45",
    "month": "Eylül 2026",
    "league": "IRAK",
    "country": "IRAK",
    "homeTeam": "Al Kahraba",
    "awayTeam": "Al Minaa Basra",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.17",
      "msX": "2.77",
      "ms2": "2.56",
      "turnaroundOdd": "28.45",
      "kgVar": "1.65",
      "ust25": "1.89"
    },
    "details": {
      "note": "Al Kahraba ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "81019a4c-7fdb-4727-8288-f7cb35508b19",
    "date": "13.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "İS4",
    "country": "İS4",
    "homeTeam": "Girona Ii",
    "awayTeam": "Tudelano",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.93",
      "msX": "2.98",
      "ms2": "2.77",
      "turnaroundOdd": "25.70",
      "kgVar": "1.65",
      "ust25": "1.82"
    },
    "details": {
      "note": "Girona Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "052ae174-0e2a-4fc3-8d4c-3b8f6d27fa15",
    "date": "13.09.2026",
    "time": "22:00",
    "month": "Eylül 2026",
    "league": "ABD-NP",
    "country": "ABD-NP",
    "homeTeam": "Chicago Fire I",
    "awayTeam": "Bethlehem Steel",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.59",
      "msX": "3.78",
      "ms2": "3.12",
      "turnaroundOdd": "39.38",
      "kgVar": "1.15"
    },
    "details": {
      "note": "Bethlehem Steel ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "4ed90a09-f81d-4af6-a902-bfc9817e250f",
    "date": "13.09.2026",
    "time": "02:00",
    "month": "Eylül 2026",
    "league": "MEKKA",
    "country": "MEKKA",
    "homeTeam": "Atletico San L",
    "awayTeam": "Santos Laguna (",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.55",
      "msX": "3.61",
      "ms2": "3.47",
      "turnaroundOdd": "43.41",
      "kgVar": "1.28"
    },
    "details": {
      "note": "Santos Laguna ( ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "452fc3d2-42bf-4629-906d-f2af007f6822",
    "date": "13.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "İSV",
    "country": "İSV",
    "homeTeam": "Zurich",
    "awayTeam": "Vaduz",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.33",
      "msX": "3.45",
      "ms2": "2.19",
      "turnaroundOdd": "30.30",
      "kgVar": "1.21",
      "ust25": "1.23"
    },
    "details": {
      "note": "Zurich ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "35483018-dc1e-439b-9ed0-e990a2d1892c",
    "date": "13.09.2026",
    "time": "13:00",
    "month": "Eylül 2026",
    "league": "POL1",
    "country": "POL1",
    "homeTeam": "Unia Skierniew",
    "awayTeam": "Pogon Grodzisk",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.04",
      "msX": "3.19",
      "ms2": "2.46",
      "turnaroundOdd": "26.96",
      "kgVar": "1.34",
      "ust25": "1.40"
    },
    "details": {
      "note": "Unia Skierniew ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "75e94ccb-1ce1-4012-9d6f-08f7e7154fe9",
    "date": "13.09.2026",
    "time": "14:00",
    "month": "Eylül 2026",
    "league": "LET",
    "country": "LET",
    "homeTeam": "Bfc Daugavpils",
    "awayTeam": "Daugava Riga",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "7.56",
      "msX": "4.79",
      "ms2": "1.15",
      "turnaroundOdd": "16.73",
      "kgVar": "1.78",
      "ust25": "1.42"
    },
    "details": {
      "note": "Daugava Riga ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "383ee26e-ba5e-468d-9e26-7b20e9d5988d",
    "date": "13.09.2026",
    "time": "15:30",
    "month": "Eylül 2026",
    "league": "S3-3",
    "country": "S3-3",
    "homeTeam": "Karaköprü Bld.",
    "awayTeam": "Osmaniyespor Fk",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.55",
      "msX": "5.43",
      "ms2": "2.29",
      "turnaroundOdd": "21.32"
    },
    "details": {
      "note": "Karaköprü Bld. ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "be729299-beec-4450-9c7f-b2bc3376d6d4",
    "date": "13.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "İTC",
    "country": "İTC",
    "homeTeam": "Sassari Torres",
    "awayTeam": "Ostia Mare Lido",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.81",
      "msX": "2.86",
      "ms2": "3.22",
      "turnaroundOdd": "24.32",
      "kgVar": "1.67",
      "ust25": "1.86"
    },
    "details": {
      "note": "Sassari Torres ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "a309e493-26da-4bdf-a2fb-17a1d605008f",
    "date": "13.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "FRU19",
    "country": "FRU19",
    "homeTeam": "Lyon U19",
    "awayTeam": "Auxerre U19",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.85",
      "msX": "3.23",
      "ms2": "2.77",
      "turnaroundOdd": "35.36",
      "kgVar": "1.36",
      "ust25": "1.42"
    },
    "details": {
      "note": "Auxerre U19 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8796f2eb-739d-4a6f-8a2e-08d818fe13b5",
    "date": "13.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "FRU19",
    "country": "FRU19",
    "homeTeam": "Valenciennes U",
    "awayTeam": "Rouen U19",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.27",
      "msX": "3.97",
      "ms2": "5.81",
      "turnaroundOdd": "70.31",
      "kgVar": "1.52",
      "ust25": "1.38"
    },
    "details": {
      "note": "Rouen U19 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "cd3c4f08-533a-490a-a3f0-3dbf5b0296be",
    "date": "13.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "YUN",
    "country": "YUN",
    "homeTeam": "Kalamata",
    "awayTeam": "Volos Nfc",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.33",
      "msX": "2.84",
      "ms2": "2.33",
      "turnaroundOdd": "30.30",
      "kgVar": "1.58",
      "ust25": "1.79"
    },
    "details": {
      "note": "Kalamata ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "52d77180-e007-456c-ab72-fd7c62718f3b",
    "date": "13.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "TSL",
    "country": "TSL",
    "homeTeam": "Gençlerbirliği",
    "awayTeam": "Kasimpaşa",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.04",
      "msX": "2.96",
      "ms2": "2.88",
      "turnaroundOdd": "36.62",
      "kgVar": "1.64",
      "ust25": "1.84"
    },
    "details": {
      "note": "Kasimpaşa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "d32b3210-de79-4f3c-89bc-80d6fdc79089",
    "date": "13.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "FAROEM",
    "country": "FAROEM",
    "homeTeam": "Streymur",
    "awayTeam": "B36 Torshavn",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.08",
      "msX": "3.43",
      "ms2": "1.68",
      "turnaroundOdd": "38.92",
      "kgVar": "1.38",
      "ust25": "1.41"
    },
    "details": {
      "note": "Streymur ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "4fb3fd7d-a94a-4d88-acfc-02a429c3b58e",
    "date": "13.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İSTL",
    "country": "İSTL",
    "homeTeam": "Marbelli",
    "awayTeam": "Ciudad De Torre",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.89",
      "msX": "2.65",
      "ms2": "3.27",
      "turnaroundOdd": "25.23",
      "kgVar": "1.87",
      "ust25": "2.20"
    },
    "details": {
      "note": "Marbelli ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fc905adb-b1b7-4ac8-b19b-7a799dbe4459",
    "date": "13.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "ARJPBM",
    "country": "ARJPBM",
    "homeTeam": "Flandria",
    "awayTeam": "Camioneros Luja",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.46",
      "msX": "2.48",
      "ms2": "2.49",
      "turnaroundOdd": "31.79",
      "kgVar": "2.15"
    },
    "details": {
      "note": "Flandria ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e615b384-ccf0-4e52-a30d-e4e8911afb9f",
    "date": "13.09.2026",
    "time": "11:30",
    "month": "Eylül 2026",
    "league": "ENDL1",
    "country": "ENDL1",
    "homeTeam": "Persita Tanger",
    "awayTeam": "Malut United",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.55",
      "msX": "2.91",
      "ms2": "2.11",
      "turnaroundOdd": "32.83",
      "kgVar": "1.50",
      "ust25": "1.65"
    },
    "details": {
      "note": "Persita Tanger ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "21fca0bd-7092-4c07-8e4b-9c97d083ddff",
    "date": "13.09.2026",
    "time": "12:00",
    "month": "Eylül 2026",
    "league": "AVTCT",
    "country": "AVTCT",
    "homeTeam": "Canberra",
    "awayTeam": "Cooma Tigers",
    "iyScore": "0 - 1",
    "msScore": "3 - 0",
    "type": "2/1",
    "odds": {
      "ms1": "1.91",
      "msX": "3.48",
      "ms2": "2.49",
      "turnaroundOdd": "25.46",
      "kgVar": "1.23",
      "ust25": "1.23"
    },
    "details": {
      "note": "Canberra ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d334e3d8-c645-48cf-bc35-40cc1fc05f34",
    "date": "13.09.2026",
    "time": "13:00",
    "month": "Eylül 2026",
    "league": "İSTL",
    "country": "İSTL",
    "homeTeam": "Pobla Mafumet",
    "awayTeam": "San Cristobal",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.35",
      "msX": "2.83",
      "ms2": "2.32",
      "turnaroundOdd": "30.53",
      "kgVar": "1.70",
      "ust25": "1.94"
    },
    "details": {
      "note": "Pobla Mafumet ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0fdb1528-e9ad-4729-838a-f26f99c9bf38",
    "date": "13.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "İTC",
    "country": "İTC",
    "homeTeam": "Athletic Carpi",
    "awayTeam": "Cittadella",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.20",
      "msX": "2.95",
      "ms2": "1.79",
      "turnaroundOdd": "24.09",
      "kgVar": "1.67",
      "ust25": "1.84"
    },
    "details": {
      "note": "Cittadella ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "69d06052-dfaf-4769-b149-84ca64711d76",
    "date": "13.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İS3",
    "country": "İS3",
    "homeTeam": "Dep. Fabril",
    "awayTeam": "Ponferradina",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.10",
      "msX": "2.73",
      "ms2": "2.71",
      "turnaroundOdd": "27.65",
      "kgVar": "1.74",
      "ust25": "2.03"
    },
    "details": {
      "note": "Dep. Fabril ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "004a5769-efc8-4b56-ae60-0cd096c8150c",
    "date": "13.09.2026",
    "time": "12:30",
    "month": "Eylül 2026",
    "league": "İSTL",
    "country": "İSTL",
    "homeTeam": "Sporting Gijon",
    "awayTeam": "Llanes",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.07",
      "msX": "5.39",
      "ms2": "11.00",
      "turnaroundOdd": "15.81",
      "ust25": "1.35"
    },
    "details": {
      "note": "Sporting Gijon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "17c4116e-318e-4e84-9887-98e1af00fbb2",
    "date": "12.09.2026",
    "time": "22:00",
    "month": "Eylül 2026",
    "league": "BR1",
    "country": "BR1",
    "homeTeam": "Gremio",
    "awayTeam": "Vasco Da Gama",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.16",
      "msX": "2.94",
      "ms2": "1.93",
      "turnaroundOdd": "25.70",
      "kgVar": "1.67",
      "ust25": "1.87"
    },
    "details": {
      "note": "Vasco Da Gama ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fe14fc14-9e85-481b-acca-b755afc78291",
    "date": "12.09.2026",
    "time": "21:30",
    "month": "Eylül 2026",
    "league": "ROM",
    "country": "ROM",
    "homeTeam": "Rapid Bükreş",
    "awayTeam": "Voluntari",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.23",
      "msX": "3.94",
      "ms2": "6.69",
      "turnaroundOdd": "17.64",
      "kgVar": "1.84",
      "ust25": "1.59"
    },
    "details": {
      "note": "Rapid Bükreş ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "61f61e3e-c25b-474e-9dcf-8297d7915651",
    "date": "12.09.2026",
    "time": "21:15",
    "month": "Eylül 2026",
    "league": "SLVN",
    "country": "SLVN",
    "homeTeam": "Ask Bravo",
    "awayTeam": "Celje",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.59",
      "msX": "3.56",
      "ms2": "1.53",
      "turnaroundOdd": "44.78",
      "kgVar": "1.34",
      "ust25": "1.32"
    },
    "details": {
      "note": "Ask Bravo ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "11a74d57-3064-428b-92d0-173d5cc7d14b",
    "date": "12.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "T1L",
    "country": "T1L",
    "homeTeam": "Ümraniyespor",
    "awayTeam": "Antalyaspor",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.48",
      "msX": "2.96",
      "ms2": "2.13",
      "turnaroundOdd": "27.99",
      "kgVar": "1.55",
      "ust25": "1.72"
    },
    "details": {
      "note": "Antalyaspor ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "9bfc8d77-ca9f-4bc1-a6c6-191677d025c7",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Hyde",
    "awayTeam": "Whitby Town",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.69",
      "msX": "3.33",
      "ms2": "3.12",
      "turnaroundOdd": "39.38",
      "kgVar": "1.44",
      "ust25": "1.48"
    },
    "details": {
      "note": "Whitby Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a7ec8255-cca7-417a-90fb-bed187d2d5c6",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İK2",
    "country": "İK2",
    "homeTeam": "Stranraer",
    "awayTeam": "Dumbarton",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.46",
      "msX": "3.59",
      "ms2": "4.03",
      "turnaroundOdd": "20.29",
      "kgVar": "1.44",
      "ust25": "1.40"
    },
    "details": {
      "note": "Stranraer ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "1abaa051-1e7e-4c0b-ab59-e901ecac8117",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Redcar Athleti",
    "awayTeam": "Leek Town",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.35",
      "msX": "3.86",
      "ms2": "4.80",
      "turnaroundOdd": "19.02",
      "kgVar": "1.58",
      "ust25": "1.48"
    },
    "details": {
      "note": "Redcar Athleti ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "46b70754-9713-47fd-8c25-bebf95125664",
    "date": "12.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "POR3",
    "country": "POR3",
    "homeTeam": "Louletano",
    "awayTeam": "Uniao Santarem",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.05",
      "msX": "2.77",
      "ms2": "2.76",
      "turnaroundOdd": "35.24",
      "kgVar": "1.76",
      "ust25": "2.04"
    },
    "details": {
      "note": "Uniao Santarem ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f75759b9-bad0-40e5-a297-63b2d3f3d61e",
    "date": "12.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "SLVN2",
    "country": "SLVN2",
    "homeTeam": "Krsko",
    "awayTeam": "Krka Novo Mesto",
    "iyScore": "1 - 0",
    "msScore": "0 - 1",
    "type": "1/2",
    "odds": {
      "ms1": "3.31",
      "msX": "3.19",
      "ms2": "1.68",
      "turnaroundOdd": "22.82",
      "kgVar": "1.47",
      "ust25": "1.54"
    },
    "details": {
      "note": "Krka Novo Mesto ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "0e4ea83a-96e7-4267-b406-7b86bec43eeb",
    "date": "12.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "SLVN2",
    "country": "SLVN2",
    "homeTeam": "Bistrica",
    "awayTeam": "Brezice",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.43",
      "msX": "3.55",
      "ms2": "4.37",
      "turnaroundOdd": "19.95",
      "kgVar": "1.55",
      "ust25": "1.51"
    },
    "details": {
      "note": "Bistrica ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "3ecf2638-77dc-42c9-b773-d1ebc9a65e1a",
    "date": "12.09.2026",
    "time": "18:30",
    "month": "Eylül 2026",
    "league": "ROM",
    "country": "ROM",
    "homeTeam": "Sepsi",
    "awayTeam": "Cfr Cluj",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.37",
      "msX": "2.68",
      "ms2": "2.40",
      "turnaroundOdd": "30.76",
      "kgVar": "1.85",
      "ust25": "2.21"
    },
    "details": {
      "note": "Sepsi ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ed78a8de-8032-4df5-abbe-f3aa57ea0f59",
    "date": "12.09.2026",
    "time": "18:30",
    "month": "Eylül 2026",
    "league": "POL",
    "country": "POL",
    "homeTeam": "Gornik Zabrze",
    "awayTeam": "Lech Poznan",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.49",
      "msX": "3.08",
      "ms2": "2.07",
      "turnaroundOdd": "32.14",
      "kgVar": "1.36",
      "ust25": "1.44"
    },
    "details": {
      "note": "Gornik Zabrze ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fe7be8dd-c432-471b-9323-46622fefa811",
    "date": "12.09.2026",
    "time": "18:30",
    "month": "Eylül 2026",
    "league": "AU2",
    "country": "AU2",
    "homeTeam": "Blau-Weiss Lin",
    "awayTeam": "Wspg Wels",
    "iyScore": "0 - 1",
    "msScore": "4 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.23",
      "msX": "4.38",
      "ms2": "5.92",
      "turnaroundOdd": "17.64",
      "kgVar": "1.55",
      "ust25": "1.35"
    },
    "details": {
      "note": "Blau-Weiss Lin ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "3cc0217b-b15a-48ec-a8a4-3d474125bdad",
    "date": "12.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "ISPU18",
    "country": "ISPU18",
    "homeTeam": "Indautxu U19",
    "awayTeam": "Santutxu U19",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.19",
      "msX": "2.97",
      "ms2": "2.39",
      "turnaroundOdd": "30.99",
      "kgVar": "1.38",
      "ust25": "1.50"
    },
    "details": {
      "note": "Santutxu U19 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "4307dd2a-ad65-45f1-8225-66a7ea3fe195",
    "date": "12.09.2026",
    "time": "19:30",
    "month": "Eylül 2026",
    "league": "İS2",
    "country": "İS2",
    "homeTeam": "Girona",
    "awayTeam": "Castellon",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.00",
      "msX": "3.10",
      "ms2": "2.81",
      "turnaroundOdd": "35.81",
      "kgVar": "1.44",
      "ust25": "1.54"
    },
    "details": {
      "note": "Castellon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "aebe68fc-c278-4d30-a77d-dcd243165fb9",
    "date": "12.09.2026",
    "time": "19:30",
    "month": "Eylül 2026",
    "league": "GAL",
    "country": "GAL",
    "homeTeam": "Colwyn Bay",
    "awayTeam": "Gap Connahs Qua",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.98",
      "msX": "2.91",
      "ms2": "1.88",
      "turnaroundOdd": "37.77",
      "kgVar": "1.65",
      "ust25": "1.83"
    },
    "details": {
      "note": "Colwyn Bay ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "164916e6-6226-4eee-925b-74e258595346",
    "date": "12.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "BLR1",
    "country": "BLR1",
    "homeTeam": "Bate Ii",
    "awayTeam": "Uni Minsk",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.04",
      "msX": "3.35",
      "ms2": "2.37",
      "turnaroundOdd": "26.96",
      "kgVar": "1.31"
    },
    "details": {
      "note": "Bate Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b95427df-d7b4-4c8c-b2ff-b56392986412",
    "date": "12.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "FR2",
    "country": "FR2",
    "homeTeam": "Guingamp",
    "awayTeam": "Annecy",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.90",
      "msX": "3.00",
      "ms2": "3.16",
      "turnaroundOdd": "25.35",
      "kgVar": "1.54",
      "ust25": "1.68"
    },
    "details": {
      "note": "Guingamp ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "2291570b-5f4e-4ebd-a5cb-3dcbb3728c68",
    "date": "12.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "TAY1",
    "country": "TAY1",
    "homeTeam": "Songkhla",
    "awayTeam": "Satun",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.79",
      "msX": "3.15",
      "ms2": "2.99",
      "turnaroundOdd": "37.89",
      "kgVar": "1.50",
      "ust25": "1.59"
    },
    "details": {
      "note": "Satun ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "9bcfe4bf-da42-4120-b8b0-ab44b607fb07",
    "date": "12.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "AL3",
    "country": "AL3",
    "homeTeam": "Verl 1924",
    "awayTeam": "Sv Meppen",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.99",
      "msX": "3.44",
      "ms2": "2.61",
      "turnaroundOdd": "26.39",
      "kgVar": "1.30",
      "ust25": "1.32"
    },
    "details": {
      "note": "Verl 1924 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "00613fd8-a177-4560-b426-28213a5a8d6c",
    "date": "12.09.2026",
    "time": "15:30",
    "month": "Eylül 2026",
    "league": "TAY1",
    "country": "TAY1",
    "homeTeam": "Muang Thong Un",
    "awayTeam": "Nong Bua Pitcha",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.47",
      "msX": "2.98",
      "ms2": "2.13",
      "turnaroundOdd": "31.91",
      "kgVar": "1.40",
      "ust25": "1.51"
    },
    "details": {
      "note": "Muang Thong Un ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "28aea6da-2f60-4dad-a030-619bddb99b8f",
    "date": "12.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "FİN2",
    "country": "FİN2",
    "homeTeam": "Jippo Joensuu",
    "awayTeam": "Klubi 04",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.59",
      "msX": "3.36",
      "ms2": "3.51",
      "turnaroundOdd": "21.79",
      "kgVar": "1.39",
      "ust25": "1.41"
    },
    "details": {
      "note": "Jippo Joensuu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b7b9fd78-1b0f-4ce8-ad8c-00c2721e21c4",
    "date": "12.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "NOR3",
    "country": "NOR3",
    "homeTeam": "Lysekloster",
    "awayTeam": "Mjondalen",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "4.54",
      "msX": "4.14",
      "ms2": "1.33",
      "turnaroundOdd": "18.80",
      "kgVar": "1.33",
      "ust25": "1.23"
    },
    "details": {
      "note": "Mjondalen ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8471b8c1-43c1-4a6b-bad1-4c8b50d2e854",
    "date": "12.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "GAF1",
    "country": "GAF1",
    "homeTeam": "Gomora United",
    "awayTeam": "Leicesterfield",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.62",
      "msX": "2.91",
      "ms2": "4.00",
      "turnaroundOdd": "49.50",
      "kgVar": "1.90",
      "ust25": "2.07"
    },
    "details": {
      "note": "Leicesterfield ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "45d8fba5-00fd-42a8-aed5-34a302cc1610",
    "date": "12.09.2026",
    "time": "16:15",
    "month": "Eylül 2026",
    "league": "RUS",
    "country": "RUS",
    "homeTeam": "Zenit",
    "awayTeam": "L.Moskova",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.23",
      "msX": "4.66",
      "ms2": "6.91",
      "turnaroundOdd": "17.64",
      "kgVar": "1.72",
      "ust25": "1.44"
    },
    "details": {
      "note": "Zenit ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "6318adc0-c4d4-4169-afea-c6bc67718560",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İN1",
    "country": "İN1",
    "homeTeam": "Cambridge",
    "awayTeam": "Reading",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.43",
      "msX": "2.88",
      "ms2": "2.21",
      "turnaroundOdd": "31.45",
      "kgVar": "1.53",
      "ust25": "1.72"
    },
    "details": {
      "note": "Cambridge ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e0ecf90b-d851-4218-9d39-e7e371f74270",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "KİRL1",
    "country": "KİRL1",
    "homeTeam": "Annagh United",
    "awayTeam": "Hw Welders",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.81",
      "msX": "3.26",
      "ms2": "1.82",
      "turnaroundOdd": "35.81",
      "kgVar": "1.36",
      "ust25": "1.41"
    },
    "details": {
      "note": "Annagh United ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c2abcae3-e9ce-4034-8b09-854d10127867",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Chatham Town",
    "awayTeam": "Lewes",
    "iyScore": "0 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.41",
      "msX": "3.92",
      "ms2": "4.09",
      "turnaroundOdd": "19.71",
      "kgVar": "1.40",
      "ust25": "1.38"
    },
    "details": {
      "note": "Chatham Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "cb2d4144-c4ec-41dd-aced-857511b504d2",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "POR3",
    "country": "POR3",
    "homeTeam": "Varzim",
    "awayTeam": "Vianense",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.47",
      "msX": "3.33",
      "ms2": "4.31",
      "turnaroundOdd": "53.06",
      "kgVar": "1.69",
      "ust25": "1.70"
    },
    "details": {
      "note": "Vianense ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f40f1946-3282-4b6a-96a0-87503614d039",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İN2",
    "country": "İN2",
    "homeTeam": "Barnet",
    "awayTeam": "Accrington",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.34",
      "msX": "3.89",
      "ms2": "4.83",
      "turnaroundOdd": "18.91",
      "kgVar": "1.44",
      "ust25": "1.34"
    },
    "details": {
      "note": "Barnet ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "64f71feb-8058-48d4-9c51-87d60828b753",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Solihull Moors",
    "awayTeam": "Aldershot",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.75",
      "msX": "3.33",
      "ms2": "2.93",
      "turnaroundOdd": "37.20",
      "kgVar": "1.34",
      "ust25": "1.37"
    },
    "details": {
      "note": "Aldershot ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5adf95b4-35f9-4f82-9559-b862d76922e9",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "SLVK2",
    "country": "SLVK2",
    "homeTeam": "Povazska Bystr",
    "awayTeam": "Humenne",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.38",
      "msX": "3.73",
      "ms2": "4.55",
      "turnaroundOdd": "19.37",
      "kgVar": "1.49",
      "ust25": "1.41"
    },
    "details": {
      "note": "Povazska Bystr ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "74f1b7f3-3dc4-466a-b381-035fb3cdcc2d",
    "date": "12.09.2026",
    "time": "11:00",
    "month": "Eylül 2026",
    "league": "ROM2",
    "country": "ROM2",
    "homeTeam": "Asu Poli Timiş",
    "awayTeam": "Ştefaneşti",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.00",
      "msX": "6.72",
      "ms2": "14.20",
      "turnaroundOdd": "15.00",
      "kgVar": "2.08"
    },
    "details": {
      "note": "Asu Poli Timiş ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "611a5269-ae7f-4967-99aa-89b33eb30968",
    "date": "12.09.2026",
    "time": "11:30",
    "month": "Eylül 2026",
    "league": "AVKB",
    "country": "AVKB",
    "homeTeam": "Darwin Hearts",
    "awayTeam": "Garuda",
    "iyScore": "2 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.06",
      "msX": "7.14",
      "ms2": "8.10",
      "turnaroundOdd": "96.65",
      "kgVar": "1.11"
    },
    "details": {
      "note": "Garuda ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "9896aedd-0e04-4078-ba71-8a6a641a41eb",
    "date": "12.09.2026",
    "time": "11:30",
    "month": "Eylül 2026",
    "league": "AVNSW",
    "country": "AVNSW",
    "homeTeam": "St. George Sai",
    "awayTeam": "Northern Tigers",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.92",
      "msX": "3.06",
      "ms2": "2.75",
      "turnaroundOdd": "25.58",
      "kgVar": "1.50",
      "ust25": "1.62"
    },
    "details": {
      "note": "St. George Sai ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "32720ae1-14d2-44a3-ada6-d493405d6dcb",
    "date": "12.09.2026",
    "time": "13:30",
    "month": "Eylül 2026",
    "league": "NOR3",
    "country": "NOR3",
    "homeTeam": "Levanger",
    "awayTeam": "Follo",
    "iyScore": "1 - 2",
    "msScore": "5 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.07",
      "msX": "6.21",
      "ms2": "8.55",
      "turnaroundOdd": "15.81",
      "kgVar": "1.42",
      "ust25": "1.10"
    },
    "details": {
      "note": "Levanger ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "82bf2f40-1644-49e0-828f-557d30439d82",
    "date": "12.09.2026",
    "time": "13:30",
    "month": "Eylül 2026",
    "league": "ISPU18",
    "country": "ISPU18",
    "homeTeam": "Danok Bat U18",
    "awayTeam": "Leioa U19",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.97",
      "msX": "3.13",
      "ms2": "2.61",
      "turnaroundOdd": "26.16",
      "kgVar": "1.35",
      "ust25": "1.42"
    },
    "details": {
      "note": "Danok Bat U18 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "91bdf23d-377b-4e6f-85b6-8aaddc597558",
    "date": "12.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "POL2",
    "country": "POL2",
    "homeTeam": "Gornik Leczna",
    "awayTeam": "Legia Warszawa",
    "iyScore": "0 - 1",
    "msScore": "4 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.67",
      "msX": "3.27",
      "ms2": "3.25",
      "turnaroundOdd": "22.70",
      "kgVar": "1.37",
      "ust25": "1.39"
    },
    "details": {
      "note": "Gornik Leczna ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "a1ec8430-4ebc-46a0-ba7b-2bcca4c29c51",
    "date": "12.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "FR2",
    "country": "FR2",
    "homeTeam": "Dunkerque",
    "awayTeam": "St Etienne",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "4.46",
      "msX": "3.81",
      "ms2": "1.44",
      "turnaroundOdd": "54.79",
      "kgVar": "1.49",
      "ust25": "1.43"
    },
    "details": {
      "note": "Dunkerque ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "60b2a366-d457-42d0-9b9e-203fe3f145b0",
    "date": "12.09.2026",
    "time": "00:00",
    "month": "Eylül 2026",
    "league": "ELSAL",
    "country": "ELSAL",
    "homeTeam": "Balboa",
    "awayTeam": "Platense",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.46",
      "msX": "2.83",
      "ms2": "2.22",
      "turnaroundOdd": "31.79",
      "kgVar": "1.63",
      "ust25": "1.86"
    },
    "details": {
      "note": "Balboa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fb840fca-bb24-49f2-8f27-da47a982b6b6",
    "date": "12.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "EST1",
    "country": "EST1",
    "homeTeam": "Nomme United",
    "awayTeam": "Flora Tallinn",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.74",
      "msX": "3.82",
      "ms2": "1.47",
      "turnaroundOdd": "20.41",
      "kgVar": "1.23"
    },
    "details": {
      "note": "Flora Tallinn ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3ef0a5e2-8893-4bb5-a6e6-8805a9b0e200",
    "date": "12.09.2026",
    "time": "09:30",
    "month": "Eylül 2026",
    "league": "AVQNPLK",
    "country": "AVQNPLK",
    "homeTeam": "Gold Coast Kni",
    "awayTeam": "Eastern Suburbs",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.65",
      "msX": "3.14",
      "ms2": "3.47",
      "turnaroundOdd": "22.47",
      "kgVar": "1.54",
      "ust25": "1.62"
    },
    "details": {
      "note": "Gold Coast Kni ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "80c3d757-751c-4384-b084-42af81a10892",
    "date": "12.09.2026",
    "time": "15:45",
    "month": "Eylül 2026",
    "league": "FR3",
    "country": "FR3",
    "homeTeam": "Valenciennes",
    "awayTeam": "Fc Fleury 91",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.06",
      "msX": "2.89",
      "ms2": "2.64",
      "turnaroundOdd": "33.86",
      "kgVar": "1.55",
      "ust25": "1.72"
    },
    "details": {
      "note": "Fc Fleury 91 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "ce253d35-7c91-49ba-8c7d-7214095160d3",
    "date": "12.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "İSÇ",
    "country": "İSÇ",
    "homeTeam": "Aik Stockholm",
    "awayTeam": "Vasteras",
    "iyScore": "1 - 0",
    "msScore": "1 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.60",
      "msX": "3.35",
      "ms2": "3.91",
      "turnaroundOdd": "48.47",
      "kgVar": "1.51",
      "ust25": "1.54"
    },
    "details": {
      "note": "Vasteras ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "95b79e51-557c-434b-8728-0658db401fa9",
    "date": "11.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "İRL",
    "country": "İRL",
    "homeTeam": "Galway United",
    "awayTeam": "Bohemian",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.69",
      "msX": "3.36",
      "ms2": "1.56",
      "turnaroundOdd": "21.44",
      "kgVar": "1.46",
      "ust25": "1.47"
    },
    "details": {
      "note": "Bohemian ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fb4a5e7c-dd32-4ac8-b513-8918162dc9ed",
    "date": "11.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "İR1",
    "country": "İR1",
    "homeTeam": "Cork City",
    "awayTeam": "Cobh Ramblers",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.27",
      "msX": "4.13",
      "ms2": "5.48",
      "turnaroundOdd": "66.52",
      "kgVar": "1.55",
      "ust25": "1.38"
    },
    "details": {
      "note": "Cobh Ramblers ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "d6d4b0cb-8741-43af-9ffe-3320b0497974",
    "date": "11.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "DKBU20",
    "country": "DKBU20",
    "homeTeam": "Arjantin U20 (",
    "awayTeam": "Meksika U20 (K)",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.01",
      "msX": "3.23",
      "ms2": "2.47",
      "turnaroundOdd": "26.61",
      "kgVar": "1.44",
      "ust25": "1.52"
    },
    "details": {
      "note": "Arjantin U20 ( ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "185c3265-0a0b-4830-bd99-eda82669fbf2",
    "date": "11.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "HOL2",
    "country": "HOL2",
    "homeTeam": "Heracles",
    "awayTeam": "Jong Az Alkmaar",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.14",
      "msX": "5.36",
      "ms2": "6.96",
      "turnaroundOdd": "16.61",
      "kgVar": "1.32",
      "ust25": "1.10"
    },
    "details": {
      "note": "Heracles ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f8e83b01-c6c2-4d6e-b48d-71aa1100f61a",
    "date": "11.09.2026",
    "time": "16:40",
    "month": "Eylül 2026",
    "league": "BAE",
    "country": "BAE",
    "homeTeam": "Hatta Dubai",
    "awayTeam": "Al Dhafra",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.49",
      "msX": "3.06",
      "ms2": "2.07",
      "turnaroundOdd": "27.30",
      "kgVar": "1.40",
      "ust25": "1.50"
    },
    "details": {
      "note": "Al Dhafra ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b1936f85-ab1d-4089-8e0c-a3f3d7515c0e",
    "date": "11.09.2026",
    "time": "16:30",
    "month": "Eylül 2026",
    "league": "HIR2",
    "country": "HIR2",
    "homeTeam": "Opatija",
    "awayTeam": "Bijelo Brdo",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.01",
      "msX": "2.72",
      "ms2": "2.88",
      "turnaroundOdd": "36.62",
      "kgVar": "1.81",
      "ust25": "2.12"
    },
    "details": {
      "note": "Bijelo Brdo ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "cfeb28f7-3797-4fe9-9c5b-3c3b0f98cf59",
    "date": "11.09.2026",
    "time": "16:30",
    "month": "Eylül 2026",
    "league": "UMM",
    "country": "UMM",
    "homeTeam": "Sur",
    "awayTeam": "Bahla Club",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.75",
      "msX": "2.82",
      "ms2": "2.03",
      "turnaroundOdd": "26.84",
      "kgVar": "1.64",
      "ust25": "1.86"
    },
    "details": {
      "note": "Bahla Club ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "bb5f1671-fe09-4cf7-98e3-37e53b3dc11f",
    "date": "11.09.2026",
    "time": "13:03",
    "month": "Eylül 2026",
    "league": "JAP",
    "country": "JAP",
    "homeTeam": "Kyoto Sanga",
    "awayTeam": "Kashiwa",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.88",
      "msX": "3.48",
      "ms2": "1.58",
      "turnaroundOdd": "21.67",
      "kgVar": "1.47",
      "ust25": "1.48"
    },
    "details": {
      "note": "Kashiwa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "aa3d804e-048c-4c16-bd56-cbbedb460f17",
    "date": "11.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "ÇEK2",
    "country": "ÇEK2",
    "homeTeam": "Trinec",
    "awayTeam": "Karvina",
    "iyScore": "0 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "4.55",
      "msX": "3.63",
      "ms2": "1.40",
      "turnaroundOdd": "55.82",
      "kgVar": "1.55",
      "ust25": "1.49"
    },
    "details": {
      "note": "Trinec ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fb4bac75-1692-4771-9c6c-ec3b9ca4c8e0",
    "date": "11.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "HOL2",
    "country": "HOL2",
    "homeTeam": "Breda",
    "awayTeam": "Utrecht (Ii)",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.15",
      "msX": "5.19",
      "ms2": "6.85",
      "turnaroundOdd": "82.27",
      "kgVar": "1.44",
      "ust25": "1.19"
    },
    "details": {
      "note": "Utrecht (Ii) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1492a7ac-b4b3-4ee1-af91-97c7edd485dc",
    "date": "11.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "ALMBÖL",
    "country": "ALMBÖL",
    "homeTeam": "Freiburg Ii",
    "awayTeam": "Sandhausen",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.10",
      "msX": "3.34",
      "ms2": "2.29",
      "turnaroundOdd": "29.84",
      "kgVar": "1.18"
    },
    "details": {
      "note": "Sandhausen ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a0ac9b14-75dc-4c9f-b9e9-bb8767065b20",
    "date": "11.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "ÜRD1",
    "country": "ÜRD1",
    "homeTeam": "Sama Al Sarhan",
    "awayTeam": "Jerash",
    "iyScore": "0 - 1",
    "msScore": "2 - 0",
    "type": "2/1",
    "odds": {
      "ms1": "1.78",
      "msX": "3.09",
      "ms2": "3.09",
      "turnaroundOdd": "23.97",
      "kgVar": "1.58",
      "ust25": "1.69"
    },
    "details": {
      "note": "Sama Al Sarhan ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "65bd27c7-78ec-4287-a596-ec2b8bc0cdce",
    "date": "10.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "EST3",
    "country": "EST3",
    "homeTeam": "Tammeka Ii",
    "awayTeam": "Viljandi Tulevi",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.73",
      "msX": "3.91",
      "ms2": "2.63",
      "turnaroundOdd": "23.39",
      "kgVar": "1.06"
    },
    "details": {
      "note": "Tammeka Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d5ac72ec-09e0-4f9b-9fbd-1617e183d4c2",
    "date": "10.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "ÖZB",
    "country": "ÖZB",
    "homeTeam": "Andijon",
    "awayTeam": "Kuruvchi Kokand",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.71",
      "msX": "2.86",
      "ms2": "3.63",
      "turnaroundOdd": "23.16",
      "kgVar": "1.77",
      "ust25": "1.95"
    },
    "details": {
      "note": "Andijon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "1d1a6dee-711e-473a-ac42-96a06f3f1ce6",
    "date": "10.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "AZER1",
    "country": "AZER1",
    "homeTeam": "Cebrayıl",
    "awayTeam": "Xankendi",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.08",
      "msX": "2.94",
      "ms2": "2.56",
      "turnaroundOdd": "27.42",
      "kgVar": "1.50",
      "ust25": "1.65"
    },
    "details": {
      "note": "Cebrayıl ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0a5551f3-b1be-458a-af7b-0c4a5f3594fb",
    "date": "09.09.2026",
    "time": "13:30",
    "month": "Eylül 2026",
    "league": "GKOR",
    "country": "GKOR",
    "homeTeam": "Daejeon Citize",
    "awayTeam": "Anyang",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.35",
      "msX": "4.07",
      "ms2": "5.24",
      "turnaroundOdd": "19.02",
      "kgVar": "1.54",
      "ust25": "1.42"
    },
    "details": {
      "note": "Daejeon Citize ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e318a044-c50d-4942-96ef-9308ff0bdcdc",
    "date": "09.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "FİN",
    "country": "FİN",
    "homeTeam": "Helsinki",
    "awayTeam": "Inter Turku",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.27",
      "msX": "3.10",
      "ms2": "2.42",
      "turnaroundOdd": "29.61",
      "kgVar": "1.40",
      "ust25": "1.51"
    },
    "details": {
      "note": "Helsinki ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "78510af2-423c-4b69-a778-28bc8cbbd3b9",
    "date": "09.09.2026",
    "time": "18:30",
    "month": "Eylül 2026",
    "league": "BULSK",
    "country": "BULSK",
    "homeTeam": "Levski Sofya",
    "awayTeam": "Cska Sofia",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.72",
      "msX": "2.87",
      "ms2": "3.59",
      "turnaroundOdd": "44.78",
      "kgVar": "1.78",
      "ust25": "1.96"
    },
    "details": {
      "note": "Cska Sofia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7733bea5-f780-48eb-bd02-4d62451667be",
    "date": "09.09.2026",
    "time": "18:45",
    "month": "Eylül 2026",
    "league": "IRAK",
    "country": "IRAK",
    "homeTeam": "Al Talaba",
    "awayTeam": "Al Karkh",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.07",
      "msX": "2.81",
      "ms2": "2.67",
      "turnaroundOdd": "27.30",
      "kgVar": "1.72",
      "ust25": "1.97"
    },
    "details": {
      "note": "Al Talaba ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "64e988cc-f733-4189-b1e1-f281dce220cc",
    "date": "09.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İSÇ2",
    "country": "İSÇ2",
    "homeTeam": "Ljungskile",
    "awayTeam": "Norrby",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.79",
      "msX": "3.19",
      "ms2": "2.95",
      "turnaroundOdd": "24.09",
      "kgVar": "1.31",
      "ust25": "1.36"
    },
    "details": {
      "note": "Ljungskile ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "66d1578d-2866-4844-8794-96b1f11371d3",
    "date": "09.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İSPFK",
    "country": "İSPFK",
    "homeTeam": "Ud Santa Marta",
    "awayTeam": "Vimenor",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.85",
      "msX": "2.93",
      "ms2": "3.04",
      "turnaroundOdd": "24.78",
      "kgVar": "1.63",
      "ust25": "1.79"
    },
    "details": {
      "note": "Ud Santa Marta ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c1e86453-ad2b-4118-a324-557e76cec23e",
    "date": "09.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "İSPFK",
    "country": "İSPFK",
    "homeTeam": "Comillas",
    "awayTeam": "Lhospitalet",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "4.19",
      "msX": "3.05",
      "ms2": "1.55",
      "turnaroundOdd": "51.69",
      "kgVar": "1.76",
      "ust25": "1.84"
    },
    "details": {
      "note": "Comillas ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "64b02eba-dc68-45e6-acbb-78f7039491bc",
    "date": "09.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "FAK",
    "country": "FAK",
    "homeTeam": "Exmouth",
    "awayTeam": "Banbury United",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.70",
      "msX": "3.01",
      "ms2": "1.97",
      "turnaroundOdd": "34.55",
      "kgVar": "1.48",
      "ust25": "1.60"
    },
    "details": {
      "note": "Exmouth ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "22c23a96-ad62-4787-a92d-7c504a83ac73",
    "date": "09.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "İULK",
    "country": "İULK",
    "homeTeam": "Tamworth",
    "awayTeam": "Middlesbrough (",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.07",
      "msX": "3.44",
      "ms2": "2.28",
      "turnaroundOdd": "29.72",
      "kgVar": "1.18"
    },
    "details": {
      "note": "Middlesbrough ( ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8612bb8a-6ac9-4bef-89d5-40a42e512a74",
    "date": "09.09.2026",
    "time": "02:30",
    "month": "Eylül 2026",
    "league": "ABD",
    "country": "ABD",
    "homeTeam": "Toronto",
    "awayTeam": "Nashville Sc",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.19",
      "msX": "3.27",
      "ms2": "1.79",
      "turnaroundOdd": "40.19",
      "kgVar": "1.47",
      "ust25": "1.55"
    },
    "details": {
      "note": "Toronto ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "69ee50ce-b079-43ae-982a-a2ef443431df",
    "date": "09.09.2026",
    "time": "22:15",
    "month": "Eylül 2026",
    "league": "İNLK",
    "country": "İNLK",
    "homeTeam": "Chelsea",
    "awayTeam": "Leeds Utd",
    "iyScore": "0 - 1",
    "msScore": "6 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "1.70",
      "msX": "3.38",
      "ms2": "3.43",
      "turnaroundOdd": "23.05",
      "kgVar": "1.40",
      "ust25": "1.44"
    },
    "details": {
      "note": "Chelsea ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "2cdf3d05-f806-4401-baed-1a8886c83fcd",
    "date": "09.09.2026",
    "time": "22:15",
    "month": "Eylül 2026",
    "league": "İZL1",
    "country": "İZL1",
    "homeTeam": "Hk Kopavogur",
    "awayTeam": "Fylkir",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.31",
      "msX": "3.50",
      "ms2": "2.03",
      "turnaroundOdd": "26.84",
      "kgVar": "1.15"
    },
    "details": {
      "note": "Fylkir ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1d506e3c-91b1-470b-b6dd-29d167a65edc",
    "date": "09.09.2026",
    "time": "23:00",
    "month": "Eylül 2026",
    "league": "VENK",
    "country": "VENK",
    "homeTeam": "Yaracuyanos",
    "awayTeam": "Aragua",
    "iyScore": "2 - 1",
    "msScore": "2 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "1.79",
      "msX": "2.84",
      "ms2": "3.34",
      "turnaroundOdd": "41.91",
      "kgVar": "1.72",
      "ust25": "1.91"
    },
    "details": {
      "note": "Aragua ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "78c00880-9d82-4fa4-9687-15f7a9d84790",
    "date": "09.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "DKBU20",
    "country": "DKBU20",
    "homeTeam": "Fransa U20 (K)",
    "awayTeam": "Ekvador U20 (K)",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.44",
      "msX": "3.61",
      "ms2": "4.24",
      "turnaroundOdd": "20.06",
      "kgVar": "1.48",
      "ust25": "1.44"
    },
    "details": {
      "note": "Fransa U20 (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "38aa30f4-20a8-4be7-b1e2-06312a9278bb",
    "date": "08.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "FAK",
    "country": "FAK",
    "homeTeam": "Boldmere St. M",
    "awayTeam": "Bourne Town",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.88",
      "msX": "3.26",
      "ms2": "2.69",
      "turnaroundOdd": "25.12",
      "kgVar": "1.43",
      "ust25": "1.50"
    },
    "details": {
      "note": "Boldmere St. M ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c5730cf3-e373-4015-a73e-51f3df72b7f7",
    "date": "08.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "UGA",
    "country": "UGA",
    "homeTeam": "Maroons",
    "awayTeam": "Blacks Power",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.80",
      "msX": "2.72",
      "ms2": "3.47",
      "turnaroundOdd": "43.41",
      "kgVar": "1.87",
      "ust25": "2.16"
    },
    "details": {
      "note": "Blacks Power ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6835808f-6e8b-4e8b-b00a-c2e7b7e3d68b",
    "date": "08.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "İNCL",
    "country": "İNCL",
    "homeTeam": "Watford",
    "awayTeam": "Prest",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.99",
      "msX": "3.04",
      "ms2": "2.91",
      "turnaroundOdd": "26.39",
      "kgVar": "1.62",
      "ust25": "1.79"
    },
    "details": {
      "note": "Watford ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f2b88dc6-3947-42cf-bfea-d0e087ce37df",
    "date": "08.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Worksop Town",
    "awayTeam": "Bedford Town",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.84",
      "msX": "3.11",
      "ms2": "2.89",
      "turnaroundOdd": "36.73",
      "kgVar": "1.49",
      "ust25": "1.58"
    },
    "details": {
      "note": "Bedford Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "d2ee9798-d87f-410b-869b-4e9beeaad14c",
    "date": "08.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Spennymoor",
    "awayTeam": "Spalding United",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.63",
      "msX": "3.05",
      "ms2": "1.99",
      "turnaroundOdd": "26.39",
      "kgVar": "1.45",
      "ust25": "1.57"
    },
    "details": {
      "note": "Spalding United ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "106cdeca-4330-484e-87f5-b6a335c4f360",
    "date": "08.09.2026",
    "time": "22:00",
    "month": "Eylül 2026",
    "league": "ŞMP",
    "country": "ŞMP",
    "homeTeam": "Lille",
    "awayTeam": "Real Betis",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.90",
      "msX": "3.12",
      "ms2": "3.03",
      "turnaroundOdd": "38.34",
      "kgVar": "1.47",
      "ust25": "1.57"
    },
    "details": {
      "note": "Real Betis ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "05617ac1-53ea-43b8-a05a-ca3619aa892b",
    "date": "08.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "ALMBÖL",
    "country": "ALMBÖL",
    "homeTeam": "Astoria Walldo",
    "awayTeam": "Stuttgarter Kic",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.69",
      "msX": "3.33",
      "ms2": "1.86",
      "turnaroundOdd": "34.44",
      "kgVar": "1.26"
    },
    "details": {
      "note": "Astoria Walldo ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "733ecc5f-5406-4c19-afd7-74a8805a711c",
    "date": "08.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "İNTK",
    "country": "İNTK",
    "homeTeam": "Doncaster",
    "awayTeam": "Huddersfield",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.42",
      "msX": "2.92",
      "ms2": "2.19",
      "turnaroundOdd": "28.68",
      "kgVar": "1.63",
      "ust25": "1.82"
    },
    "details": {
      "note": "Huddersfield ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "65fed424-611c-420d-ba85-fd815cceba6e",
    "date": "07.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Molde 2",
    "awayTeam": "Aalesund B",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.08",
      "msX": "3.96",
      "ms2": "2.09",
      "turnaroundOdd": "27.42",
      "kgVar": "1.00"
    },
    "details": {
      "note": "Molde 2 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "45a0f13a-4e1b-45cf-b759-25120441a6f2",
    "date": "07.09.2026",
    "time": "20:30",
    "month": "Eylül 2026",
    "league": "MAC2",
    "country": "MAC2",
    "homeTeam": "Mol Vidi",
    "awayTeam": "Diosgyor",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.89",
      "msX": "2.98",
      "ms2": "2.88",
      "turnaroundOdd": "25.23",
      "kgVar": "1.55",
      "ust25": "1.69"
    },
    "details": {
      "note": "Mol Vidi ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "39a609c2-4cc6-4e75-91ac-522bd0e7262d",
    "date": "07.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "İNPLK",
    "country": "İNPLK",
    "homeTeam": "Plymouth Argyl",
    "awayTeam": "Cardiff City U2",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.99",
      "msX": "4.09",
      "ms2": "1.58",
      "turnaroundOdd": "21.67",
      "kgVar": "1.17"
    },
    "details": {
      "note": "Cardiff City U2 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "4b4b7d40-d773-4820-b21f-f21d3b65cee1",
    "date": "07.09.2026",
    "time": "22:00",
    "month": "Eylül 2026",
    "league": "KİKPL",
    "country": "KİKPL",
    "homeTeam": "Glentoran (K)",
    "awayTeam": "Linfield (K)",
    "iyScore": "0 - 1",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.77",
      "msX": "3.58",
      "ms2": "2.72",
      "turnaroundOdd": "23.86",
      "kgVar": "1.19"
    },
    "details": {
      "note": "Glentoran (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "944c784e-de8c-4e21-b79c-d41f0465d185",
    "date": "07.09.2026",
    "time": "02:00",
    "month": "Eylül 2026",
    "league": "ARJPBM",
    "country": "ARJPBM",
    "homeTeam": "Excur",
    "awayTeam": "Ituzaingo",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.20",
      "msX": "3.90",
      "ms2": "8.12",
      "turnaroundOdd": "17.30",
      "kgVar": "2.27",
      "ust25": "1.85"
    },
    "details": {
      "note": "Excur ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b3444c3e-2763-4e73-aff7-a23712cec4c1",
    "date": "06.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "ALKB",
    "country": "ALKB",
    "homeTeam": "Wolfsburg (K)",
    "awayTeam": "Werder Bremen (",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.23",
      "msX": "4.56",
      "ms2": "5.76",
      "turnaroundOdd": "17.64",
      "kgVar": "1.44"
    },
    "details": {
      "note": "Wolfsburg (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "66076056-c1e3-4baa-afcc-090b328842f9",
    "date": "06.09.2026",
    "time": "15:30",
    "month": "Eylül 2026",
    "league": "HOL",
    "country": "HOL",
    "homeTeam": "Heerenveen",
    "awayTeam": "Az Alkmaar",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.32",
      "msX": "3.69",
      "ms2": "1.65",
      "turnaroundOdd": "22.47",
      "kgVar": "1.28",
      "ust25": "1.27"
    },
    "details": {
      "note": "Az Alkmaar ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "679ec8ad-80c1-4126-90ad-fcd1d820b171",
    "date": "06.09.2026",
    "time": "15:30",
    "month": "Eylül 2026",
    "league": "POL2",
    "country": "POL2",
    "homeTeam": "Znicz Pruszkow",
    "awayTeam": "Hutnik Krakow",
    "iyScore": "1 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.76",
      "msX": "3.17",
      "ms2": "3.05",
      "turnaroundOdd": "23.74",
      "kgVar": "1.35",
      "ust25": "1.40"
    },
    "details": {
      "note": "Znicz Pruszkow ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0d430e62-da43-40a9-89fe-4da2d21d5027",
    "date": "06.09.2026",
    "time": "16:45",
    "month": "Eylül 2026",
    "league": "BAE",
    "country": "BAE",
    "homeTeam": "Al Nasr",
    "awayTeam": "Ajman",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.84",
      "msX": "3.07",
      "ms2": "2.92",
      "turnaroundOdd": "37.08",
      "kgVar": "1.42",
      "ust25": "1.51"
    },
    "details": {
      "note": "Ajman ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "0563b9af-d42b-4591-a072-7c436702aa1f",
    "date": "06.09.2026",
    "time": "01:30",
    "month": "Eylül 2026",
    "league": "ŞİL",
    "country": "ŞİL",
    "homeTeam": "Palestino",
    "awayTeam": "Univ De Concepc",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.51",
      "msX": "3.39",
      "ms2": "4.00",
      "turnaroundOdd": "20.86",
      "kgVar": "1.50",
      "ust25": "1.49"
    },
    "details": {
      "note": "Palestino ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "a24f8ce2-e9a4-4012-9083-f24eca340382",
    "date": "06.09.2026",
    "time": "22:00",
    "month": "Eylül 2026",
    "league": "GUAT",
    "country": "GUAT",
    "homeTeam": "Coban Imperial",
    "awayTeam": "Guastatoya",
    "iyScore": "1 - 0",
    "msScore": "0 - 1",
    "type": "1/2",
    "odds": {
      "ms1": "1.61",
      "msX": "3.00",
      "ms2": "3.91",
      "turnaroundOdd": "48.47",
      "kgVar": "1.73",
      "ust25": "1.86"
    },
    "details": {
      "note": "Guastatoya ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "d2422caf-b7e7-4cb6-97f3-2bc5eb84506d",
    "date": "06.09.2026",
    "time": "11:00",
    "month": "Eylül 2026",
    "league": "JWEL",
    "country": "JWEL",
    "homeTeam": "Nojima Stella",
    "awayTeam": "Inac Kobe Leone",
    "iyScore": "1 - 0",
    "msScore": "1 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "3.54",
      "msX": "3.22",
      "ms2": "1.62",
      "turnaroundOdd": "22.13",
      "kgVar": "1.56",
      "ust25": "1.62"
    },
    "details": {
      "note": "Inac Kobe Leone ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "bbd6ef2f-0d95-4e51-853c-3187cc597ad8",
    "date": "06.09.2026",
    "time": "14:00",
    "month": "Eylül 2026",
    "league": "MAC3",
    "country": "MAC3",
    "homeTeam": "Mtk Ii",
    "awayTeam": "Dunaharaszti",
    "iyScore": "1 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.28",
      "msX": "4.09",
      "ms2": "5.46",
      "turnaroundOdd": "18.22",
      "kgVar": "1.44"
    },
    "details": {
      "note": "Mtk Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ba4f77c9-122c-4235-a064-2c81c85433fb",
    "date": "06.09.2026",
    "time": "14:00",
    "month": "Eylül 2026",
    "league": "DAN1",
    "country": "DAN1",
    "homeTeam": "Aarhus Fremad",
    "awayTeam": "Kolding If",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.35",
      "msX": "2.90",
      "ms2": "2.28",
      "turnaroundOdd": "30.53",
      "kgVar": "1.44",
      "ust25": "1.58"
    },
    "details": {
      "note": "Aarhus Fremad ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "81fc4ec6-c42e-4046-863a-9cfff3777bef",
    "date": "06.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "İTC",
    "country": "İTC",
    "homeTeam": "Sambenedetese",
    "awayTeam": "Spezia",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.45",
      "msX": "2.93",
      "ms2": "1.72",
      "turnaroundOdd": "23.28",
      "kgVar": "1.69",
      "ust25": "1.85"
    },
    "details": {
      "note": "Spezia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "54d5a0cd-49c5-4bd8-967e-168703c04210",
    "date": "06.09.2026",
    "time": "02:00",
    "month": "Eylül 2026",
    "league": "NİK",
    "country": "NİK",
    "homeTeam": "Walter Ferrett",
    "awayTeam": "Managua",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.33",
      "msX": "3.24",
      "ms2": "1.66",
      "turnaroundOdd": "22.59",
      "kgVar": "1.43",
      "ust25": "1.47"
    },
    "details": {
      "note": "Managua ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a958f71a-ecb9-453e-924d-9cc2985db5eb",
    "date": "06.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "ENDL1",
    "country": "ENDL1",
    "homeTeam": "Persib",
    "awayTeam": "Psm Makassar",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.19",
      "msX": "4.34",
      "ms2": "7.17",
      "turnaroundOdd": "17.18",
      "kgVar": "1.80",
      "ust25": "1.50"
    },
    "details": {
      "note": "Persib ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0858352c-3a33-40a5-91d5-e6233ccc3d78",
    "date": "06.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İKP",
    "country": "İKP",
    "homeTeam": "Hearts",
    "awayTeam": "Dundee",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.28",
      "msX": "4.39",
      "ms2": "6.06",
      "turnaroundOdd": "18.22",
      "kgVar": "1.57",
      "ust25": "1.38"
    },
    "details": {
      "note": "Hearts ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "6e0494cd-dcee-4d4e-b814-84dcbe234ce0",
    "date": "06.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "FİN2",
    "country": "FİN2",
    "homeTeam": "Sjk Ii",
    "awayTeam": "Japs",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.70",
      "msX": "3.06",
      "ms2": "1.94",
      "turnaroundOdd": "25.81",
      "kgVar": "1.40",
      "ust25": "1.50"
    },
    "details": {
      "note": "Japs ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "744cc021-4394-4c38-8f46-5c518ef691e9",
    "date": "06.09.2026",
    "time": "18:30",
    "month": "Eylül 2026",
    "league": "AL1",
    "country": "AL1",
    "homeTeam": "E.Frankfurt",
    "awayTeam": "Augsburg",
    "iyScore": "1 - 0",
    "msScore": "1 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.65",
      "msX": "3.71",
      "ms2": "3.35",
      "turnaroundOdd": "42.02",
      "kgVar": "1.25",
      "ust25": "1.23"
    },
    "details": {
      "note": "Augsburg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "832cfe6a-8725-4fd4-a79e-49bae12643a6",
    "date": "06.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İS4",
    "country": "İS4",
    "homeTeam": "Dep. Guadalaja",
    "awayTeam": "Salamanca",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.13",
      "msX": "2.98",
      "ms2": "2.47",
      "turnaroundOdd": "31.91",
      "kgVar": "1.60",
      "ust25": "1.78"
    },
    "details": {
      "note": "Salamanca ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a79bbce5-be63-48ab-9a34-579f04d08d74",
    "date": "06.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İS4",
    "country": "İS4",
    "homeTeam": "Antoniano",
    "awayTeam": "Don Benito",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.07",
      "msX": "2.77",
      "ms2": "2.74",
      "turnaroundOdd": "35.01",
      "kgVar": "1.71",
      "ust25": "1.96"
    },
    "details": {
      "note": "Don Benito ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "38e634d5-458c-49b9-9167-1af7c0b62f3e",
    "date": "06.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "HIR2",
    "country": "HIR2",
    "homeTeam": "Karlovac 1919",
    "awayTeam": "Hrvace",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.68",
      "msX": "3.08",
      "ms2": "3.43",
      "turnaroundOdd": "22.82",
      "kgVar": "1.58",
      "ust25": "1.68"
    },
    "details": {
      "note": "Karlovac 1919 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "50a92d25-d6c0-49c6-b5d6-07f3887e04c5",
    "date": "05.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İNP",
    "country": "İNP",
    "homeTeam": "Fulham",
    "awayTeam": "Crystal Palace",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.90",
      "msX": "3.05",
      "ms2": "3.09",
      "turnaroundOdd": "39.03",
      "kgVar": "1.54",
      "ust25": "1.67"
    },
    "details": {
      "note": "Crystal Palace ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1b4e8aa3-6ddc-42a4-8623-136d3d0661ab",
    "date": "05.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İK1",
    "country": "İK1",
    "homeTeam": "Queen Of South",
    "awayTeam": "Airdrieonians",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.81",
      "msX": "3.16",
      "ms2": "1.86",
      "turnaroundOdd": "35.81",
      "kgVar": "1.48",
      "ust25": "1.58"
    },
    "details": {
      "note": "Queen Of South ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d105e924-1021-4a58-b589-e77b90c2fd54",
    "date": "05.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İN2",
    "country": "İN2",
    "homeTeam": "Swindon",
    "awayTeam": "Colchester",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.36",
      "msX": "3.02",
      "ms2": "2.19",
      "turnaroundOdd": "30.64",
      "kgVar": "1.42",
      "ust25": "1.54"
    },
    "details": {
      "note": "Swindon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "4a6f0ffb-1791-4cc0-8d19-880e104d4bdf",
    "date": "05.09.2026",
    "time": "17:00",
    "month": "Eylül 2026",
    "league": "İK2",
    "country": "İK2",
    "homeTeam": "Clyde",
    "awayTeam": "Edinburg C.",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.69",
      "msX": "3.35",
      "ms2": "3.12",
      "turnaroundOdd": "22.93",
      "kgVar": "1.37",
      "ust25": "1.40"
    },
    "details": {
      "note": "Clyde ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e4156212-6b22-4e8b-bc4f-3f2fc473d73a",
    "date": "05.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "ÇEK2",
    "country": "ÇEK2",
    "homeTeam": "Opava",
    "awayTeam": "Dukla Prag",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.22",
      "msX": "2.93",
      "ms2": "2.38",
      "turnaroundOdd": "30.87",
      "kgVar": "1.44",
      "ust25": "1.58"
    },
    "details": {
      "note": "Dukla Prag ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "11ca0957-3a6b-4d99-bee3-b952bc470184",
    "date": "05.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "İZL2",
    "country": "İZL2",
    "homeTeam": "Kfa",
    "awayTeam": "Dalvik",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.65",
      "msX": "3.82",
      "ms2": "2.90",
      "turnaroundOdd": "36.85",
      "kgVar": "1.11"
    },
    "details": {
      "note": "Dalvik ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "43c31724-e8cf-45ed-976d-660e654e74c7",
    "date": "05.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "BOSN",
    "country": "BOSN",
    "homeTeam": "Radnik Bijelji",
    "awayTeam": "Sloga Doboj",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.18",
      "msX": "2.56",
      "ms2": "2.76",
      "turnaroundOdd": "35.24",
      "kgVar": "1.93"
    },
    "details": {
      "note": "Sloga Doboj ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7e38ba76-ccc6-4ef8-b06d-d1ec40737412",
    "date": "05.09.2026",
    "time": "12:00",
    "month": "Eylül 2026",
    "league": "JWEL",
    "country": "JWEL",
    "homeTeam": "Omiya (K)",
    "awayTeam": "Albirex Niigata",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.30",
      "msX": "2.82",
      "ms2": "2.36",
      "turnaroundOdd": "29.95",
      "kgVar": "1.74",
      "ust25": "2.01"
    },
    "details": {
      "note": "Omiya (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e6983770-1cb5-4602-a659-91bb830a3bdf",
    "date": "05.09.2026",
    "time": "12:14",
    "month": "Eylül 2026",
    "league": "AVNPL",
    "country": "AVNPL",
    "homeTeam": "Monaro Panther",
    "awayTeam": "Cooma Tigers",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.94",
      "msX": "3.50",
      "ms2": "2.43",
      "turnaroundOdd": "31.45",
      "kgVar": "1.17",
      "ust25": "1.18"
    },
    "details": {
      "note": "Cooma Tigers ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b1b88736-b443-4d03-bff7-b60e78f423e2",
    "date": "05.09.2026",
    "time": "13:00",
    "month": "Eylül 2026",
    "league": "PORU23",
    "country": "PORU23",
    "homeTeam": "Leixoes U23",
    "awayTeam": "Sporting Cp U23",
    "iyScore": "3 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.28",
      "msX": "3.02",
      "ms2": "2.27",
      "turnaroundOdd": "29.61",
      "kgVar": "1.41",
      "ust25": "1.52"
    },
    "details": {
      "note": "Sporting Cp U23 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8249675c-f642-46e0-871c-6842deff56e4",
    "date": "05.09.2026",
    "time": "14:00",
    "month": "Eylül 2026",
    "league": "VİET",
    "country": "VİET",
    "homeTeam": "Van Hoa Hai Ph",
    "awayTeam": "Ttbd Phu Dong",
    "iyScore": "1 - 0",
    "msScore": "1 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "4.03",
      "msX": "3.62",
      "ms2": "1.45",
      "turnaroundOdd": "20.18",
      "kgVar": "1.48",
      "ust25": "1.44"
    },
    "details": {
      "note": "Ttbd Phu Dong ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b1738602-d6c7-4617-8b26-d3aee30f0fbb",
    "date": "05.09.2026",
    "time": "14:00",
    "month": "Eylül 2026",
    "league": "KAZP",
    "country": "KAZP",
    "homeTeam": "Okzhetpes",
    "awayTeam": "Ordabasy",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "5.08",
      "msX": "3.93",
      "ms2": "1.31",
      "turnaroundOdd": "61.92",
      "kgVar": "1.55",
      "ust25": "1.42"
    },
    "details": {
      "note": "Okzhetpes ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c24db694-8900-489c-bea2-5d6057befa3d",
    "date": "05.09.2026",
    "time": "14:00",
    "month": "Eylül 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Frigg",
    "awayTeam": "If Ready",
    "iyScore": "1 - 2",
    "msScore": "5 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.76",
      "msX": "3.84",
      "ms2": "2.61",
      "turnaroundOdd": "23.74",
      "kgVar": "1.08"
    },
    "details": {
      "note": "Frigg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "29b57af4-ce35-4d82-b567-b39225f847d8",
    "date": "05.09.2026",
    "time": "14:00",
    "month": "Eylül 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Örebro Syrians",
    "awayTeam": "Sleipner",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.40",
      "msX": "3.22",
      "ms2": "2.07",
      "turnaroundOdd": "27.30",
      "kgVar": "1.34",
      "ust25": "1.40"
    },
    "details": {
      "note": "Sleipner ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7cd6d8e2-ee41-4abe-be9a-e15951f19622",
    "date": "05.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "POR",
    "country": "POR",
    "homeTeam": "Alverca",
    "awayTeam": "Braga",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "4.39",
      "msX": "3.19",
      "ms2": "1.58",
      "turnaroundOdd": "21.67",
      "kgVar": "1.86",
      "ust25": "1.96"
    },
    "details": {
      "note": "Braga ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6b2d954a-262e-4f91-9f6b-62469e73c318",
    "date": "05.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İS4",
    "country": "İS4",
    "homeTeam": "Castellon Ii",
    "awayTeam": "Intercity",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.46",
      "msX": "2.96",
      "ms2": "2.14",
      "turnaroundOdd": "28.11",
      "kgVar": "1.40",
      "ust25": "1.51"
    },
    "details": {
      "note": "Intercity ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1f613165-17a4-469e-8ff9-585307ee6742",
    "date": "05.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "LIT1",
    "country": "LIT1",
    "homeTeam": "Atmosfera",
    "awayTeam": "Tauras",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.74",
      "msX": "3.04",
      "ms2": "1.93",
      "turnaroundOdd": "35.01",
      "kgVar": "1.44",
      "ust25": "1.54"
    },
    "details": {
      "note": "Atmosfera ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "95d86a41-1cf5-4fd4-a57c-42b0260fc403",
    "date": "05.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "GAF1",
    "country": "GAF1",
    "homeTeam": "Leicesterfield",
    "awayTeam": "Magesi Fc",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.32",
      "msX": "2.84",
      "ms2": "1.79",
      "turnaroundOdd": "24.09",
      "kgVar": "1.72",
      "ust25": "1.92"
    },
    "details": {
      "note": "Magesi Fc ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a09ff516-06d3-4938-b0fa-8db3e151aaac",
    "date": "05.09.2026",
    "time": "22:00",
    "month": "Eylül 2026",
    "league": "İKP",
    "country": "İKP",
    "homeTeam": "St Mirren",
    "awayTeam": "Celtic",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "6.10",
      "msX": "4.69",
      "ms2": "1.25",
      "turnaroundOdd": "17.88",
      "kgVar": "1.48",
      "ust25": "1.29"
    },
    "details": {
      "note": "Celtic ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "75ffc5c3-83ec-4914-9abd-f2a96369f3b1",
    "date": "05.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "LET",
    "country": "LET",
    "homeTeam": "Fk Tukums 2000",
    "awayTeam": "Ogre United",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.73",
      "msX": "3.20",
      "ms2": "3.12",
      "turnaroundOdd": "23.39",
      "kgVar": "1.32",
      "ust25": "1.38"
    },
    "details": {
      "note": "Fk Tukums 2000 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b1d317d1-5331-482d-b578-d14e0b8d5b38",
    "date": "05.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "ALMBÖL",
    "country": "ALMBÖL",
    "homeTeam": "Rödinghausen",
    "awayTeam": "Wiedenbruck",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.44",
      "msX": "3.56",
      "ms2": "4.25",
      "turnaroundOdd": "52.38",
      "kgVar": "1.44",
      "ust25": "1.44"
    },
    "details": {
      "note": "Wiedenbruck ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a48ac6c6-70d3-4a2e-bf3e-dd4b5a87a0bd",
    "date": "05.09.2026",
    "time": "17:18",
    "month": "Eylül 2026",
    "league": "MAC3",
    "country": "MAC3",
    "homeTeam": "Bss Monor",
    "awayTeam": "Bkv Elore",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.08",
      "msX": "6.16",
      "ms2": "8.35",
      "turnaroundOdd": "15.92",
      "kgVar": "1.48"
    },
    "details": {
      "note": "Bss Monor ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c3e65af0-f035-47be-9271-c63f85f7fad7",
    "date": "05.09.2026",
    "time": "16:30",
    "month": "Eylül 2026",
    "league": "AL1",
    "country": "AL1",
    "homeTeam": "M Gladbach",
    "awayTeam": "Elversberg",
    "iyScore": "2 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.73",
      "msX": "3.53",
      "ms2": "3.15",
      "turnaroundOdd": "39.73",
      "kgVar": "1.30",
      "ust25": "1.30"
    },
    "details": {
      "note": "Elversberg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "27b799fd-f54a-4577-bb7b-3b411161d8ab",
    "date": "05.09.2026",
    "time": "16:30",
    "month": "Eylül 2026",
    "league": "AL1",
    "country": "AL1",
    "homeTeam": "Hoffenheim",
    "awayTeam": "B.Dortmund",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.20",
      "msX": "3.38",
      "ms2": "2.35",
      "turnaroundOdd": "30.53",
      "kgVar": "1.25",
      "ust25": "1.28"
    },
    "details": {
      "note": "B.Dortmund ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f00effc6-c506-4f8d-a58d-4e7e6dfb3665",
    "date": "05.09.2026",
    "time": "16:00",
    "month": "Eylül 2026",
    "league": "HOLTW",
    "country": "HOLTW",
    "homeTeam": "Rohda Raalte",
    "awayTeam": "Kozakken Boys",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "5.08",
      "msX": "4.20",
      "ms2": "1.29",
      "turnaroundOdd": "18.34",
      "kgVar": "1.41"
    },
    "details": {
      "note": "Kozakken Boys ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "bb50760c-22b0-4ab8-b059-fa8523b30ea6",
    "date": "05.09.2026",
    "time": "16:30",
    "month": "Eylül 2026",
    "league": "AVK",
    "country": "AVK",
    "homeTeam": "Blau-Weiss Lin",
    "awayTeam": "Wacker Innsbruc",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.33",
      "msX": "3.96",
      "ms2": "4.85",
      "turnaroundOdd": "59.27",
      "kgVar": "1.42"
    },
    "details": {
      "note": "Wacker Innsbruc ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5024d92d-b726-406c-89c4-d602318fcf42",
    "date": "05.09.2026",
    "time": "14:30",
    "month": "Eylül 2026",
    "league": "BOSN",
    "country": "BOSN",
    "homeTeam": "Bsk Banja Luka",
    "awayTeam": "Celik",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.21",
      "msX": "2.69",
      "ms2": "2.57",
      "turnaroundOdd": "28.91",
      "kgVar": "1.64",
      "ust25": "1.89"
    },
    "details": {
      "note": "Bsk Banja Luka ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b1a04e09-afcc-41b2-80d2-be6707bdbfeb",
    "date": "05.09.2026",
    "time": "14:30",
    "month": "Eylül 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Southend",
    "awayTeam": "Yeovil",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.39",
      "msX": "3.69",
      "ms2": "4.53",
      "turnaroundOdd": "19.48",
      "kgVar": "1.52",
      "ust25": "1.45"
    },
    "details": {
      "note": "Southend ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f84392b8-693c-4b64-b6af-9d204660af45",
    "date": "04.09.2026",
    "time": "03:30",
    "month": "Eylül 2026",
    "league": "EKV1",
    "country": "EKV1",
    "homeTeam": "T.Universitari",
    "awayTeam": "Ldu Quito",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.74",
      "msX": "2.94",
      "ms2": "1.65",
      "turnaroundOdd": "22.47",
      "kgVar": "1.77",
      "ust25": "1.93"
    },
    "details": {
      "note": "Ldu Quito ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "c3faa24b-ff40-4689-99a4-356042c2a332",
    "date": "04.09.2026",
    "time": "01:00",
    "month": "Eylül 2026",
    "league": "URU",
    "country": "URU",
    "homeTeam": "Torque",
    "awayTeam": "Cerro Largo",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.40",
      "msX": "3.33",
      "ms2": "5.12",
      "turnaroundOdd": "19.60",
      "kgVar": "1.89",
      "ust25": "1.85"
    },
    "details": {
      "note": "Torque ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ea522810-7bf1-4c1b-9c66-cae1ee04aa45",
    "date": "04.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Ragsved",
    "awayTeam": "Haninge",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.60",
      "msX": "3.53",
      "ms2": "1.85",
      "turnaroundOdd": "33.40",
      "kgVar": "1.16"
    },
    "details": {
      "note": "Ragsved ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0b6ce477-dab4-4091-aef6-f1859ceb8a7b",
    "date": "04.09.2026",
    "time": "20:30",
    "month": "Eylül 2026",
    "league": "İSV2",
    "country": "İSV2",
    "homeTeam": "Aarau",
    "awayTeam": "Rappersvil Jona",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.44",
      "msX": "3.87",
      "ms2": "3.91",
      "turnaroundOdd": "20.06",
      "kgVar": "1.29",
      "ust25": "1.23"
    },
    "details": {
      "note": "Aarau ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b505f6c9-95ac-4b16-a872-486567235a44",
    "date": "04.09.2026",
    "time": "20:00",
    "month": "Eylül 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Landvetter Is",
    "awayTeam": "Kongahalla",
    "iyScore": "2 - 0",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.11",
      "msX": "5.19",
      "ms2": "8.18",
      "turnaroundOdd": "97.57",
      "kgVar": "1.60"
    },
    "details": {
      "note": "Kongahalla ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f72f10a3-3495-4eb0-b3ad-3d54c8cdf837",
    "date": "04.09.2026",
    "time": "16:30",
    "month": "Eylül 2026",
    "league": "BLR1",
    "country": "BLR1",
    "homeTeam": "Fc Minsk Ii",
    "awayTeam": "Niva Dolbizno",
    "iyScore": "2 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "6.16",
      "msX": "5.07",
      "ms2": "1.17",
      "turnaroundOdd": "16.95",
      "kgVar": "1.34"
    },
    "details": {
      "note": "Niva Dolbizno ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "0e114e69-7bcf-4ade-af6d-251e062cdd86",
    "date": "04.09.2026",
    "time": "22:05",
    "month": "Eylül 2026",
    "league": "FR1",
    "country": "FR1",
    "homeTeam": "Psg",
    "awayTeam": "Monaco",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.17",
      "msX": "5.45",
      "ms2": "7.17",
      "turnaroundOdd": "85.95",
      "kgVar": "1.47",
      "ust25": "1.22"
    },
    "details": {
      "note": "Monaco ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b730c4d0-b624-4fa0-bfce-5023c5927615",
    "date": "04.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "BAH",
    "country": "BAH",
    "homeTeam": "Khalidiya",
    "awayTeam": "Aali Fc",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.18",
      "msX": "4.53",
      "ms2": "7.07",
      "turnaroundOdd": "17.07",
      "kgVar": "1.77",
      "ust25": "1.45"
    },
    "details": {
      "note": "Khalidiya ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "712c04ed-5c78-4918-92e8-8cbfd18aacf8",
    "date": "04.09.2026",
    "time": "14:07",
    "month": "Eylül 2026",
    "league": "AVNPL",
    "country": "AVNPL",
    "homeTeam": "Bayswater City",
    "awayTeam": "Olympic Kingswa",
    "iyScore": "0 - 1",
    "msScore": "5 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "1.77",
      "msX": "3.34",
      "ms2": "2.89",
      "turnaroundOdd": "23.86",
      "kgVar": "1.26",
      "ust25": "1.28"
    },
    "details": {
      "note": "Bayswater City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d07268d9-bfe5-4091-beb0-9770c04c4b13",
    "date": "03.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "IRAK",
    "country": "IRAK",
    "homeTeam": "Duhok",
    "awayTeam": "Al Jawiya",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.50",
      "msX": "2.61",
      "ms2": "2.34",
      "turnaroundOdd": "32.25",
      "kgVar": "1.66",
      "ust25": "1.96"
    },
    "details": {
      "note": "Duhok ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "dc7c34c2-2030-4e57-a97a-c13cbe0bc919",
    "date": "03.09.2026",
    "time": "21:30",
    "month": "Eylül 2026",
    "league": "İSV",
    "country": "İSV",
    "homeTeam": "Basel",
    "awayTeam": "Sion",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.15",
      "msX": "3.32",
      "ms2": "2.43",
      "turnaroundOdd": "31.45",
      "kgVar": "1.32",
      "ust25": "1.37"
    },
    "details": {
      "note": "Sion ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1c32b91b-c0b5-426b-b6dd-fda7e7d75e0b",
    "date": "02.09.2026",
    "time": "03:00",
    "month": "Eylül 2026",
    "league": "EKV1",
    "country": "EKV1",
    "homeTeam": "Barcelona Gua",
    "awayTeam": "Indep. Jose Ter",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.46",
      "msX": "3.04",
      "ms2": "1.69",
      "turnaroundOdd": "43.29",
      "kgVar": "1.63",
      "ust25": "1.74"
    },
    "details": {
      "note": "Barcelona Gua ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "a482e50d-7b69-4895-a362-540e35ae8dbc",
    "date": "02.09.2026",
    "time": "19:00",
    "month": "Eylül 2026",
    "league": "NOK",
    "country": "NOK",
    "homeTeam": "Brodd",
    "awayTeam": "Viking",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "5.63",
      "msX": "4.78",
      "ms2": "1.22",
      "turnaroundOdd": "17.53",
      "kgVar": "1.16"
    },
    "details": {
      "note": "Viking ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a6149abf-1864-49b9-b70b-961c85597c75",
    "date": "02.09.2026",
    "time": "02:00",
    "month": "Eylül 2026",
    "league": "USLP",
    "country": "USLP",
    "homeTeam": "Charleston Bat",
    "awayTeam": "Hartford Athlet",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.47",
      "msX": "3.49",
      "ms2": "4.09",
      "turnaroundOdd": "50.53",
      "kgVar": "1.47",
      "ust25": "1.44"
    },
    "details": {
      "note": "Hartford Athlet ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "4c717c71-0120-41be-9f55-f064808c6bac",
    "date": "02.09.2026",
    "time": "13:00",
    "month": "Eylül 2026",
    "league": "JAP",
    "country": "JAP",
    "homeTeam": "Avispa Fukuoka",
    "awayTeam": "Urawa",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.51",
      "msX": "2.88",
      "ms2": "2.32",
      "turnaroundOdd": "30.18",
      "kgVar": "1.75",
      "ust25": "2.02"
    },
    "details": {
      "note": "Urawa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "0c9673cc-b770-4cc1-8fe1-f3e210b9f9a0",
    "date": "02.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "ŞMP-K",
    "country": "ŞMP-K",
    "homeTeam": "Oh Leuven (K)",
    "awayTeam": "Czarni Sosnowie",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.25",
      "msX": "4.39",
      "ms2": "5.39",
      "turnaroundOdd": "17.88",
      "kgVar": "1.44"
    },
    "details": {
      "note": "Oh Leuven (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "03067541-4bb3-430a-9398-901166db0a34",
    "date": "02.09.2026",
    "time": "21:00",
    "month": "Eylül 2026",
    "league": "HOK",
    "country": "HOK",
    "homeTeam": "Usv Hercules",
    "awayTeam": "Evv",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.07",
      "msX": "3.40",
      "ms2": "2.30",
      "turnaroundOdd": "29.95",
      "kgVar": "1.16"
    },
    "details": {
      "note": "Evv ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "c85b2e01-22b3-4ac5-a38d-c7e60642deeb",
    "date": "01.09.2026",
    "time": "18:00",
    "month": "Eylül 2026",
    "league": "LITK",
    "country": "LITK",
    "homeTeam": "Minija",
    "awayTeam": "Fk Dainava",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.43",
      "msX": "3.54",
      "ms2": "4.40",
      "turnaroundOdd": "19.95",
      "kgVar": "1.51",
      "ust25": "1.47"
    },
    "details": {
      "note": "Minija ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "bfd7f696-0789-4cae-8e46-c134f4f128ed",
    "date": "01.09.2026",
    "time": "18:30",
    "month": "Eylül 2026",
    "league": "POLK",
    "country": "POLK",
    "homeTeam": "Odra Opole",
    "awayTeam": "Wisla Krakow",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.28",
      "msX": "3.27",
      "ms2": "1.66",
      "turnaroundOdd": "41.22",
      "kgVar": "1.40",
      "ust25": "1.44"
    },
    "details": {
      "note": "Odra Opole ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b81fdaec-6a48-434a-9c2b-15de5134a687",
    "date": "01.09.2026",
    "time": "03:00",
    "month": "Eylül 2026",
    "league": "BRK",
    "country": "BRK",
    "homeTeam": "Atletico Mg",
    "awayTeam": "Cruzeiro",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.35",
      "msX": "2.73",
      "ms2": "2.61",
      "turnaroundOdd": "30.53",
      "kgVar": "1.83",
      "ust25": "2.19"
    },
    "details": {
      "note": "Atletico Mg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "446d676d-43a7-44ff-b73c-2fe59e9a0b46",
    "date": "01.09.2026",
    "time": "21:45",
    "month": "Eylül 2026",
    "league": "İKCK",
    "country": "İKCK",
    "homeTeam": "Stranraer",
    "awayTeam": "Celtic Ii",
    "iyScore": "1 - 0",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.78",
      "msX": "3.55",
      "ms2": "2.71",
      "turnaroundOdd": "34.66",
      "kgVar": "1.24"
    },
    "details": {
      "note": "Celtic Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7cba4357-2e62-4f9e-8147-2371a59b0a59",
    "date": "01.09.2026",
    "time": "15:00",
    "month": "Eylül 2026",
    "league": "INGPDL",
    "country": "INGPDL",
    "homeTeam": "Bristol City U",
    "awayTeam": "Sheffield Unite",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.32",
      "msX": "3.54",
      "ms2": "2.01",
      "turnaroundOdd": "30.18",
      "kgVar": "1.19"
    },
    "details": {
      "note": "Bristol City U ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "65eae903-bded-4b3b-81a3-4ce5dcf08e0c",
    "date": "01.09.2026",
    "time": "20:30",
    "month": "Eylül 2026",
    "league": "AVU",
    "country": "AVU",
    "homeTeam": "Wolfsberger",
    "awayTeam": "Lask Linz",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "6.07",
      "msX": "4.88",
      "ms2": "1.24",
      "turnaroundOdd": "17.76",
      "kgVar": "1.41",
      "ust25": "1.22"
    },
    "details": {
      "note": "Lask Linz ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8d423f7c-8c04-4a07-a1fb-66d81a7d8b04",
    "date": "31.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Hanworth Villa",
    "awayTeam": "Chertsey Town",
    "iyScore": "0 - 1",
    "msScore": "4 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.27",
      "msX": "3.01",
      "ms2": "2.28",
      "turnaroundOdd": "29.61",
      "kgVar": "1.41",
      "ust25": "1.51"
    },
    "details": {
      "note": "Hanworth Villa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "dd314116-e012-494d-8c35-e390a0069cc6",
    "date": "31.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Boston United",
    "awayTeam": "Hornchurch",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.77",
      "msX": "3.08",
      "ms2": "3.11",
      "turnaroundOdd": "39.27",
      "kgVar": "1.53",
      "ust25": "1.65"
    },
    "details": {
      "note": "Hornchurch ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "73888818-0a74-4a4e-87ab-09b76636f825",
    "date": "31.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Worthing",
    "awayTeam": "Boreham Wood",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "5.11",
      "msX": "4.54",
      "ms2": "1.26",
      "turnaroundOdd": "17.99",
      "kgVar": "1.33",
      "ust25": "1.19"
    },
    "details": {
      "note": "Boreham Wood ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "bd1aeb55-040b-49ec-8908-473a29deabde",
    "date": "31.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Malvern Town",
    "awayTeam": "Chippenham Town",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.44",
      "msX": "3.20",
      "ms2": "2.04",
      "turnaroundOdd": "26.96",
      "kgVar": "1.39",
      "ust25": "1.47"
    },
    "details": {
      "note": "Chippenham Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "54bbfe3e-684f-412e-a898-5dbaff9ce803",
    "date": "31.08.2026",
    "time": "01:30",
    "month": "Ağustos 2026",
    "league": "VEN",
    "country": "VEN",
    "homeTeam": "Ucv",
    "awayTeam": "Rayo Zuliano",
    "iyScore": "0 - 1",
    "msScore": "4 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.27",
      "msX": "4.05",
      "ms2": "5.59",
      "turnaroundOdd": "18.11",
      "kgVar": "1.58",
      "ust25": "1.41"
    },
    "details": {
      "note": "Ucv ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "13c087b8-ceac-4d0c-a716-84f814bc1e75",
    "date": "31.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Basingstoke",
    "awayTeam": "Bracknell Town",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.07",
      "msX": "3.19",
      "ms2": "2.40",
      "turnaroundOdd": "27.30",
      "kgVar": "1.30",
      "ust25": "1.38"
    },
    "details": {
      "note": "Basingstoke ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "bfbce489-be33-44de-849a-b6591241f575",
    "date": "31.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "INGPL2",
    "country": "INGPL2",
    "homeTeam": "Chelsea (B)",
    "awayTeam": "West Ham (B)",
    "iyScore": "1 - 3",
    "msScore": "5 - 4",
    "type": "2/1",
    "odds": {
      "ms1": "1.73",
      "msX": "3.65",
      "ms2": "2.77",
      "turnaroundOdd": "23.39",
      "kgVar": "1.20"
    },
    "details": {
      "note": "Chelsea (B) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "88fdd8d1-a311-4823-a01f-54a31670a325",
    "date": "30.08.2026",
    "time": "20:55",
    "month": "Ağustos 2026",
    "league": "KUV",
    "country": "KUV",
    "homeTeam": "Al-Jahra",
    "awayTeam": "Al Arabi",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "9.67",
      "msX": "5.31",
      "ms2": "1.09",
      "turnaroundOdd": "114.70",
      "kgVar": "1.95",
      "ust25": "1.42"
    },
    "details": {
      "note": "Al-Jahra ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "59f9a213-16ac-4ff9-936b-07ca00383819",
    "date": "30.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "If Ready",
    "awayTeam": "Gamle Oslo",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.06",
      "msX": "3.83",
      "ms2": "1.60",
      "turnaroundOdd": "21.90",
      "kgVar": "1.11"
    },
    "details": {
      "note": "Gamle Oslo ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fdea2fcd-13f9-43f5-ad21-c6221ed9aef5",
    "date": "30.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Karlslunds If",
    "awayTeam": "Syrianska",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.78",
      "msX": "3.47",
      "ms2": "2.79",
      "turnaroundOdd": "23.97"
    },
    "details": {
      "note": "Karlslunds If ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "beb2b4cb-6fb9-4a96-bc6c-758137a24d70",
    "date": "30.08.2026",
    "time": "08:00",
    "month": "Ağustos 2026",
    "league": "AVNPL",
    "country": "AVNPL",
    "homeTeam": "Sutherland Sha",
    "awayTeam": "Sd Raiders",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.05",
      "msX": "3.45",
      "ms2": "1.68",
      "turnaroundOdd": "22.82",
      "kgVar": "1.35",
      "ust25": "1.39"
    },
    "details": {
      "note": "Sd Raiders ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e6720e21-8c6f-4a6b-853c-7eb6f1144eb3",
    "date": "30.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "POK",
    "country": "POK",
    "homeTeam": "Salgueiros",
    "awayTeam": "Sousense",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.43",
      "msX": "3.05",
      "ms2": "5.49",
      "turnaroundOdd": "19.95",
      "kgVar": "2.16",
      "ust25": "2.17"
    },
    "details": {
      "note": "Salgueiros ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "7ea7619e-429a-480a-ac29-e76980f19221",
    "date": "30.08.2026",
    "time": "22:30",
    "month": "Ağustos 2026",
    "league": "İS2",
    "country": "İS2",
    "homeTeam": "Cordoba",
    "awayTeam": "Granada",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.62",
      "msX": "3.27",
      "ms2": "3.95",
      "turnaroundOdd": "48.93",
      "kgVar": "1.59",
      "ust25": "1.65"
    },
    "details": {
      "note": "Granada ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "69550d0b-5724-427a-acc0-e107bd25b37d",
    "date": "30.08.2026",
    "time": "23:00",
    "month": "Ağustos 2026",
    "league": "ARJ",
    "country": "ARJ",
    "homeTeam": "Argentinos Jr",
    "awayTeam": "Aldosivi",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.22",
      "msX": "4.15",
      "ms2": "8.75",
      "turnaroundOdd": "17.53",
      "kgVar": "2.40",
      "ust25": "1.93"
    },
    "details": {
      "note": "Argentinos Jr ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "282ee025-104d-4b5f-9b2c-3854c773cb94",
    "date": "30.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "DAN1",
    "country": "DAN1",
    "homeTeam": "Hvidovre",
    "awayTeam": "Fredericia",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.08",
      "msX": "3.26",
      "ms2": "1.72",
      "turnaroundOdd": "38.92",
      "kgVar": "1.39",
      "ust25": "1.44"
    },
    "details": {
      "note": "Hvidovre ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f2c3e742-5cb0-4086-b377-e237f7e5a4a2",
    "date": "30.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Drobak/Frogn",
    "awayTeam": "Fram Larvik",
    "iyScore": "2 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.86",
      "msX": "3.44",
      "ms2": "2.60",
      "turnaroundOdd": "33.40",
      "kgVar": "1.17"
    },
    "details": {
      "note": "Fram Larvik ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "02a5c4e4-c7ae-4068-b9be-60e09a3bfd78",
    "date": "30.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "UGA",
    "country": "UGA",
    "homeTeam": "Maroons",
    "awayTeam": "Ura",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.18",
      "msX": "2.53",
      "ms2": "2.80",
      "turnaroundOdd": "35.70",
      "kgVar": "2.07"
    },
    "details": {
      "note": "Ura ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f82da80b-544e-4fd2-9994-a56d396c8acf",
    "date": "30.08.2026",
    "time": "17:30",
    "month": "Ağustos 2026",
    "league": "AL3",
    "country": "AL3",
    "homeTeam": "Havelse",
    "awayTeam": "Waldhof Mannhei",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "3.88",
      "msX": "3.90",
      "ms2": "1.51",
      "turnaroundOdd": "48.12",
      "kgVar": "1.32",
      "ust25": "1.28"
    },
    "details": {
      "note": "Havelse ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "490f8d38-ed52-4a50-a501-dffb05ad6616",
    "date": "30.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "NOR",
    "country": "NOR",
    "homeTeam": "Viking",
    "awayTeam": "Aalesund",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.16",
      "msX": "5.83",
      "ms2": "7.11",
      "turnaroundOdd": "16.84",
      "kgVar": "1.31",
      "ust25": "1.10"
    },
    "details": {
      "note": "Viking ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ed5c46b8-3c65-47aa-98c4-d2421eaeb275",
    "date": "30.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "BLR",
    "country": "BLR",
    "homeTeam": "Bate Borisov",
    "awayTeam": "Minsk",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.11",
      "msX": "2.83",
      "ms2": "2.61",
      "turnaroundOdd": "27.76",
      "kgVar": "1.69",
      "ust25": "1.93"
    },
    "details": {
      "note": "Bate Borisov ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "831d97a7-31f4-4422-a2ab-e9aae7bc74bb",
    "date": "30.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "JAP3",
    "country": "JAP3",
    "homeTeam": "Parceiro Nagan",
    "awayTeam": "Kusatsu Gunma",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.33",
      "msX": "2.91",
      "ms2": "2.28",
      "turnaroundOdd": "29.72",
      "kgVar": "1.48",
      "ust25": "1.63"
    },
    "details": {
      "note": "Kusatsu Gunma ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7fee6974-569a-4169-917c-3b7f4c5ad007",
    "date": "30.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "BLR",
    "country": "BLR",
    "homeTeam": "Arsenal",
    "awayTeam": "Torpedo Zhodino",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "4.68",
      "msX": "3.40",
      "ms2": "1.42",
      "turnaroundOdd": "19.83",
      "kgVar": "1.75",
      "ust25": "1.72"
    },
    "details": {
      "note": "Torpedo Zhodino ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "50ac3848-1205-4707-a823-9aef0669440d",
    "date": "30.08.2026",
    "time": "14:30",
    "month": "Ağustos 2026",
    "league": "EST1",
    "country": "EST1",
    "homeTeam": "Nomme Kalju",
    "awayTeam": "Levadia Tallinn",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "4.97",
      "msX": "3.90",
      "ms2": "1.33",
      "turnaroundOdd": "18.80",
      "kgVar": "1.51",
      "ust25": "1.39"
    },
    "details": {
      "note": "Levadia Tallinn ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "63c9cb95-afee-4789-aea6-48e2acfdf711",
    "date": "30.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "KAZP",
    "country": "KAZP",
    "homeTeam": "Kaspyi",
    "awayTeam": "Tobol Kostanay",
    "iyScore": "0 - 1",
    "msScore": "1 - 0",
    "type": "2/1",
    "odds": {
      "ms1": "2.70",
      "msX": "3.09",
      "ms2": "1.93",
      "turnaroundOdd": "34.55",
      "kgVar": "1.45",
      "ust25": "1.56"
    },
    "details": {
      "note": "Kaspyi ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "040d8f81-f0f4-4b6c-bee4-4a520d399dbd",
    "date": "30.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "FAROEM",
    "country": "FAROEM",
    "homeTeam": "Runavik",
    "awayTeam": "Ab Argir",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.00",
      "msX": "6.38",
      "ms2": "11.10",
      "turnaroundOdd": "15.00",
      "kgVar": "1.68"
    },
    "details": {
      "note": "Runavik ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "bf689e97-5a97-4c05-9ddf-a55bf4dd15e1",
    "date": "30.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Falu Bs",
    "awayTeam": "Bollstanas",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.37",
      "msX": "3.96",
      "ms2": "4.38",
      "turnaroundOdd": "19.26",
      "kgVar": "1.36"
    },
    "details": {
      "note": "Falu Bs ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "8d6a7603-a0ad-4570-9763-d630a0b1e413",
    "date": "30.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "İSÇ",
    "country": "İSÇ",
    "homeTeam": "Aik Stockholm",
    "awayTeam": "Hammarby",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "6.47",
      "msX": "4.79",
      "ms2": "1.23",
      "turnaroundOdd": "77.91",
      "kgVar": "1.58",
      "ust25": "1.35"
    },
    "details": {
      "note": "Aik Stockholm ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "6a8a18b0-7be2-4cd6-a6ec-67f3eac463b0",
    "date": "30.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "KAZP",
    "country": "KAZP",
    "homeTeam": "Irtysh",
    "awayTeam": "Aktobe",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.36",
      "msX": "3.12",
      "ms2": "2.14",
      "turnaroundOdd": "30.64",
      "kgVar": "1.39",
      "ust25": "1.48"
    },
    "details": {
      "note": "Irtysh ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "af9a38d9-97f7-415d-870c-d40a0a559940",
    "date": "29.08.2026",
    "time": "00:00",
    "month": "Ağustos 2026",
    "league": "HON",
    "country": "HON",
    "homeTeam": "Genesis Pn",
    "awayTeam": "Marathon",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.95",
      "msX": "2.70",
      "ms2": "2.00",
      "turnaroundOdd": "26.50",
      "kgVar": "1.74",
      "ust25": "2.01"
    },
    "details": {
      "note": "Marathon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6cc2afb9-5e00-4486-9c86-66f56aa09462",
    "date": "29.08.2026",
    "time": "23:30",
    "month": "Ağustos 2026",
    "league": "PER",
    "country": "PER",
    "homeTeam": "Univ De Cajama",
    "awayTeam": "Universitario",
    "iyScore": "2 - 1",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.88",
      "msX": "2.87",
      "ms2": "1.93",
      "turnaroundOdd": "25.70",
      "kgVar": "1.63",
      "ust25": "1.82"
    },
    "details": {
      "note": "Universitario ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3b86be70-2446-4158-b506-93a58f2e14e9",
    "date": "29.08.2026",
    "time": "04:30",
    "month": "Ağustos 2026",
    "league": "HON",
    "country": "HON",
    "homeTeam": "Depor Motagua",
    "awayTeam": "Olancho",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.51",
      "msX": "3.38",
      "ms2": "4.01",
      "turnaroundOdd": "20.86",
      "kgVar": "1.42",
      "ust25": "1.41"
    },
    "details": {
      "note": "Depor Motagua ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d14c3467-7893-422c-9e0d-3c2e02e96a18",
    "date": "29.08.2026",
    "time": "21:30",
    "month": "Ağustos 2026",
    "league": "T1L",
    "country": "T1L",
    "homeTeam": "Batman Petrol",
    "awayTeam": "Sivasspor",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.98",
      "msX": "2.92",
      "ms2": "2.74",
      "turnaroundOdd": "26.27",
      "kgVar": "1.54",
      "ust25": "1.70"
    },
    "details": {
      "note": "Batman Petrol ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e1c2393f-1e9e-4523-92de-8aa8e7510b1c",
    "date": "29.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "ÇEK2",
    "country": "ÇEK2",
    "homeTeam": "Hanacka Slavia",
    "awayTeam": "Prostejov",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.95",
      "msX": "2.94",
      "ms2": "2.79",
      "turnaroundOdd": "25.93",
      "kgVar": "1.53",
      "ust25": "1.68"
    },
    "details": {
      "note": "Hanacka Slavia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "da81c7b0-2033-464e-9dc2-9431e774a557",
    "date": "29.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "İSV",
    "country": "İSV",
    "homeTeam": "Lausanne",
    "awayTeam": "Zurich",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.80",
      "msX": "3.29",
      "ms2": "3.13",
      "turnaroundOdd": "39.49",
      "kgVar": "1.39",
      "ust25": "1.45"
    },
    "details": {
      "note": "Zurich ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3f7adaba-c27a-4e0e-9727-a3a0d1305ac8",
    "date": "29.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "T1L",
    "country": "T1L",
    "homeTeam": "Kayserispor",
    "awayTeam": "Bursaspor",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.14",
      "msX": "2.89",
      "ms2": "2.52",
      "turnaroundOdd": "32.48",
      "kgVar": "1.55",
      "ust25": "1.73"
    },
    "details": {
      "note": "Bursaspor ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "98d68ad2-5887-44dc-9e79-36d647086776",
    "date": "29.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "TSL",
    "country": "TSL",
    "homeTeam": "Konyaspor",
    "awayTeam": "Kocaelispor",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.71",
      "msX": "2.97",
      "ms2": "3.96",
      "turnaroundOdd": "49.04",
      "kgVar": "2.02",
      "ust25": "2.25"
    },
    "details": {
      "note": "Kocaelispor ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b0151641-0519-4628-b342-7551ed09b4b4",
    "date": "29.08.2026",
    "time": "19:30",
    "month": "Ağustos 2026",
    "league": "BAE",
    "country": "BAE",
    "homeTeam": "Al Ain",
    "awayTeam": "Al Nasr",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.35",
      "msX": "3.83",
      "ms2": "4.80",
      "turnaroundOdd": "19.02",
      "kgVar": "1.45",
      "ust25": "1.36"
    },
    "details": {
      "note": "Al Ain ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "92a3e58c-cb51-48fe-ae8b-1c7fb091281e",
    "date": "29.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "ARJPBN",
    "country": "ARJPBN",
    "homeTeam": "Rafaela",
    "awayTeam": "Tristan",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.56",
      "msX": "2.28",
      "ms2": "2.63",
      "turnaroundOdd": "32.94",
      "kgVar": "2.38"
    },
    "details": {
      "note": "Rafaela ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "49e098f0-e5ce-4672-bde1-e3f6efe5478e",
    "date": "29.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "AL2",
    "country": "AL2",
    "homeTeam": "Heidenheim",
    "awayTeam": "Dynamo Dresden",
    "iyScore": "0 - 1",
    "msScore": "5 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.00",
      "msX": "3.26",
      "ms2": "2.70",
      "turnaroundOdd": "26.50",
      "kgVar": "1.35",
      "ust25": "1.41"
    },
    "details": {
      "note": "Heidenheim ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "6174ac8a-74eb-4401-958c-3f86e933241d",
    "date": "29.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Lilla Torg",
    "awayTeam": "Rappe",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.74",
      "msX": "3.22",
      "ms2": "3.07",
      "turnaroundOdd": "23.51",
      "kgVar": "1.37",
      "ust25": "1.42"
    },
    "details": {
      "note": "Lilla Torg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "089159d7-91b8-4103-bb7a-092b4dce197f",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Darlington 188",
    "awayTeam": "Macclesfield",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.98",
      "msX": "3.32",
      "ms2": "1.74",
      "turnaroundOdd": "23.51",
      "kgVar": "1.32",
      "ust25": "1.35"
    },
    "details": {
      "note": "Macclesfield ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "31c4c24a-b0ed-4590-829b-d3c497a67b17",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Stratford Town",
    "awayTeam": "Needham Market",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.45",
      "msX": "2.95",
      "ms2": "2.15",
      "turnaroundOdd": "28.22",
      "kgVar": "1.46",
      "ust25": "1.59"
    },
    "details": {
      "note": "Needham Market ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a5f88801-6b0f-49b0-9d36-a4d34fd2e916",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Alfreton",
    "awayTeam": "Rylands",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.71",
      "msX": "3.19",
      "ms2": "3.21",
      "turnaroundOdd": "40.41",
      "kgVar": "1.55",
      "ust25": "1.63"
    },
    "details": {
      "note": "Rylands ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "d32d80a7-c7d9-4754-b8c3-56d9386b2baa",
    "date": "29.08.2026",
    "time": "18:15",
    "month": "Ağustos 2026",
    "league": "FR1",
    "country": "FR1",
    "homeTeam": "Strasbourg",
    "awayTeam": "Lens",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.44",
      "msX": "3.47",
      "ms2": "1.67",
      "turnaroundOdd": "43.06",
      "kgVar": "1.37",
      "ust25": "1.39"
    },
    "details": {
      "note": "Strasbourg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "1f711099-2835-4bb2-b83c-71dd9d02d3a9",
    "date": "29.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "HOLTW",
    "country": "HOLTW",
    "homeTeam": "Jong Almere Ci",
    "awayTeam": "Koninklijke Hfc",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.46",
      "msX": "3.73",
      "ms2": "3.89",
      "turnaroundOdd": "48.23",
      "kgVar": "1.39"
    },
    "details": {
      "note": "Koninklijke Hfc ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "00548087-e9d1-49c3-b71b-86c436aa2a19",
    "date": "29.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "HOLTW",
    "country": "HOLTW",
    "homeTeam": "Kozakken Boys",
    "awayTeam": "Gvvv",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.07",
      "msX": "3.43",
      "ms2": "2.30",
      "turnaroundOdd": "27.30",
      "kgVar": "1.28"
    },
    "details": {
      "note": "Kozakken Boys ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "497c47bb-df67-45cc-8ca3-6819525eb49c",
    "date": "29.08.2026",
    "time": "16:30",
    "month": "Ağustos 2026",
    "league": "AL1",
    "country": "AL1",
    "homeTeam": "Köln",
    "awayTeam": "Hoffenheim",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.64",
      "msX": "3.26",
      "ms2": "2.03",
      "turnaroundOdd": "33.86",
      "kgVar": "1.34",
      "ust25": "1.40"
    },
    "details": {
      "note": "Köln ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f9122594-0c98-46c0-b16c-5ac1dfa94af2",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Leighton Town",
    "awayTeam": "Bury Town",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.31",
      "msX": "3.09",
      "ms2": "2.20",
      "turnaroundOdd": "28.80",
      "kgVar": "1.48",
      "ust25": "1.59"
    },
    "details": {
      "note": "Bury Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "bb4fff96-924d-464b-aaf8-ec1f3af0ea28",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Bath City",
    "awayTeam": "Uxbridge",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.72",
      "msX": "3.23",
      "ms2": "3.15",
      "turnaroundOdd": "39.73",
      "kgVar": "1.40",
      "ust25": "1.45"
    },
    "details": {
      "note": "Uxbridge ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "98b83e41-574c-4020-bd26-01c8d22eb632",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İN1",
    "country": "İN1",
    "homeTeam": "Notts County",
    "awayTeam": "Burton Albion",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.92",
      "msX": "2.96",
      "ms2": "2.85",
      "turnaroundOdd": "25.58",
      "kgVar": "1.58",
      "ust25": "1.74"
    },
    "details": {
      "note": "Notts County ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e19ad11d-a5b3-429d-a9a3-dee7f62754c1",
    "date": "29.08.2026",
    "time": "17:30",
    "month": "Ağustos 2026",
    "league": "BLR",
    "country": "BLR",
    "homeTeam": "Dinamo Brest",
    "awayTeam": "Ml Vitebsk",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.09",
      "msX": "2.98",
      "ms2": "1.81",
      "turnaroundOdd": "24.32",
      "kgVar": "1.64",
      "ust25": "1.79"
    },
    "details": {
      "note": "Ml Vitebsk ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fc3e7f46-9cab-4c26-870b-09661cbf1cb5",
    "date": "29.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "SIRP",
    "country": "SIRP",
    "homeTeam": "Zeleznicar Pan",
    "awayTeam": "Radnik Surdulic",
    "iyScore": "0 - 1",
    "msScore": "5 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.59",
      "msX": "3.07",
      "ms2": "3.89",
      "turnaroundOdd": "21.79",
      "kgVar": "1.70",
      "ust25": "1.79"
    },
    "details": {
      "note": "Zeleznicar Pan ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0961a8e3-9cee-4a77-999a-f4febdd4464a",
    "date": "29.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "İTB",
    "country": "İTB",
    "homeTeam": "Sampdoria",
    "awayTeam": "Juve Stabia",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.61",
      "msX": "3.05",
      "ms2": "4.34",
      "turnaroundOdd": "53.41",
      "kgVar": "1.89",
      "ust25": "2.03"
    },
    "details": {
      "note": "Juve Stabia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "65e60eef-901b-491f-b5bf-4046c0b75606",
    "date": "29.08.2026",
    "time": "08:00",
    "month": "Ağustos 2026",
    "league": "AVNPL",
    "country": "AVNPL",
    "homeTeam": "Melbourne City",
    "awayTeam": "Green Gully",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.68",
      "msX": "3.61",
      "ms2": "1.79",
      "turnaroundOdd": "24.09",
      "kgVar": "1.23",
      "ust25": "1.37"
    },
    "details": {
      "note": "Green Gully ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e55d9fc2-2d59-4243-931a-d523feb199a8",
    "date": "29.08.2026",
    "time": "09:00",
    "month": "Ağustos 2026",
    "league": "AVNPL",
    "country": "AVNPL",
    "homeTeam": "Cooma Tigers",
    "awayTeam": "Canberra Juvent",
    "iyScore": "0 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.16",
      "msX": "5.37",
      "ms2": "6.12",
      "turnaroundOdd": "16.84",
      "kgVar": "1.23",
      "ust25": "1.09"
    },
    "details": {
      "note": "Cooma Tigers ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f820f890-a57f-486b-8b52-60531fb3e8f9",
    "date": "29.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "GK3L",
    "country": "GK3L",
    "homeTeam": "Dangjin Citize",
    "awayTeam": "Chuncheon Citiz",
    "iyScore": "1 - 0",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.91",
      "msX": "3.20",
      "ms2": "2.66",
      "turnaroundOdd": "34.09",
      "kgVar": "1.43",
      "ust25": "1.51"
    },
    "details": {
      "note": "Chuncheon Citiz ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7bbc4e1c-52c0-4ba5-98f4-baf2ca0ccb19",
    "date": "29.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "JAP3",
    "country": "JAP3",
    "homeTeam": "Kamatamare San",
    "awayTeam": "Kagoshima Unite",
    "iyScore": "1 - 0",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "3.70",
      "msX": "3.02",
      "ms2": "1.64",
      "turnaroundOdd": "22.36",
      "kgVar": "1.72",
      "ust25": "1.84"
    },
    "details": {
      "note": "Kagoshima Unite ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b5ab8738-df75-4a85-80e3-29e38a8d8b6d",
    "date": "29.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "JAP2",
    "country": "JAP2",
    "homeTeam": "Kofu",
    "awayTeam": "Sapporo",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.77",
      "msX": "2.98",
      "ms2": "1.94",
      "turnaroundOdd": "35.36",
      "kgVar": "1.56",
      "ust25": "1.72"
    },
    "details": {
      "note": "Kofu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0b421b2a-1826-4574-9ec6-590d4d1b9ff0",
    "date": "29.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "ÇEK",
    "country": "ÇEK",
    "homeTeam": "Pardubice",
    "awayTeam": "Sk Artis Brno",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.64",
      "msX": "3.07",
      "ms2": "3.63",
      "turnaroundOdd": "45.24",
      "kgVar": "1.53",
      "ust25": "1.60"
    },
    "details": {
      "note": "Sk Artis Brno ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5fb88e96-f1f0-46db-a9d4-4f918db81dfc",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Hebburn Town",
    "awayTeam": "Lynn Town",
    "iyScore": "1 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.30",
      "msX": "3.01",
      "ms2": "2.25",
      "turnaroundOdd": "29.95",
      "kgVar": "1.44",
      "ust25": "1.57"
    },
    "details": {
      "note": "Hebburn Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "264c9231-3c1a-4589-b4e1-3cd1f20a89dc",
    "date": "29.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Hemel",
    "awayTeam": "Weston-S-Mare",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.18",
      "msX": "2.85",
      "ms2": "2.49",
      "turnaroundOdd": "32.14",
      "kgVar": "1.69",
      "ust25": "1.93"
    },
    "details": {
      "note": "Weston-S-Mare ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "bfd57a56-43d7-425b-b075-c93dd9c44693",
    "date": "29.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "ÇİN2",
    "country": "ÇİN2",
    "homeTeam": "Heilongjiang L",
    "awayTeam": "Suzhou Dongwu",
    "iyScore": "2 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.23",
      "msX": "2.80",
      "ms2": "2.47",
      "turnaroundOdd": "31.91",
      "kgVar": "1.56",
      "ust25": "1.75"
    },
    "details": {
      "note": "Suzhou Dongwu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "113dca4f-2c2f-4ecd-a031-4d775f36db7f",
    "date": "28.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "BR2",
    "country": "BR2",
    "homeTeam": "Nautico",
    "awayTeam": "Athletic Club",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.58",
      "msX": "3.11",
      "ms2": "3.91",
      "turnaroundOdd": "21.67",
      "kgVar": "1.76",
      "ust25": "1.86"
    },
    "details": {
      "note": "Nautico ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "14c86fc6-9706-423f-9299-8169738da68e",
    "date": "28.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Guiseley",
    "awayTeam": "Lancaster City",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.72",
      "msX": "3.19",
      "ms2": "3.18",
      "turnaroundOdd": "40.07",
      "kgVar": "1.52",
      "ust25": "1.61"
    },
    "details": {
      "note": "Lancaster City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8fb18624-8171-43ba-8fe6-cbef064aa46a",
    "date": "28.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Southend",
    "awayTeam": "Kidderminster",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.37",
      "msX": "3.65",
      "ms2": "4.83",
      "turnaroundOdd": "59.05",
      "kgVar": "1.61",
      "ust25": "1.52"
    },
    "details": {
      "note": "Kidderminster ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3d5cad4a-9a3f-48eb-a2f5-5640e96cafd4",
    "date": "28.08.2026",
    "time": "02:00",
    "month": "Ağustos 2026",
    "league": "KAPL",
    "country": "KAPL",
    "homeTeam": "Atletico Ottaw",
    "awayTeam": "Inter Toronto",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.45",
      "msX": "3.68",
      "ms2": "3.95",
      "turnaroundOdd": "20.18",
      "kgVar": "1.33",
      "ust25": "1.29"
    },
    "details": {
      "note": "Atletico Ottaw ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "8928b165-2e78-470e-80d8-4fc1f83546de",
    "date": "28.08.2026",
    "time": "21:00",
    "month": "Ağustos 2026",
    "league": "INGPL2",
    "country": "INGPL2",
    "homeTeam": "Everton (B)",
    "awayTeam": "Southampton (B)",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.08",
      "msX": "3.41",
      "ms2": "2.28",
      "turnaroundOdd": "29.72",
      "kgVar": "1.28"
    },
    "details": {
      "note": "Southampton (B) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3f6f3c7d-9ac2-4e47-ab40-fc3e0169f03c",
    "date": "28.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "SLVN2",
    "country": "SLVN2",
    "homeTeam": "Nd Primorje",
    "awayTeam": "Krka Novo Mesto",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.84",
      "msX": "3.14",
      "ms2": "2.85",
      "turnaroundOdd": "24.66",
      "kgVar": "1.50",
      "ust25": "1.60"
    },
    "details": {
      "note": "Nd Primorje ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "2b066ebc-86b9-49d3-99ed-81c5fbd3166a",
    "date": "28.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "HIR2",
    "country": "HIR2",
    "homeTeam": "Dubrava Zagred",
    "awayTeam": "Croatia Zmijavc",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.31",
      "msX": "2.79",
      "ms2": "2.37",
      "turnaroundOdd": "30.76",
      "kgVar": "1.70",
      "ust25": "1.96"
    },
    "details": {
      "note": "Croatia Zmijavc ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3a9464f1-5c14-4767-9259-a9241a4e8305",
    "date": "28.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İR1",
    "country": "İR1",
    "homeTeam": "Ucd",
    "awayTeam": "Finn Harps",
    "iyScore": "1 - 2",
    "msScore": "5 - 4",
    "type": "2/1",
    "odds": {
      "ms1": "1.06",
      "msX": "6.10",
      "ms2": "9.63",
      "turnaroundOdd": "15.69",
      "kgVar": "1.59",
      "ust25": "1.18"
    },
    "details": {
      "note": "Ucd ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "5bdcd042-d208-41e2-ab09-a4477828c74a",
    "date": "28.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "İRL",
    "country": "İRL",
    "homeTeam": "Drogheda",
    "awayTeam": "Dundalk",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.49",
      "msX": "2.89",
      "ms2": "2.16",
      "turnaroundOdd": "28.34",
      "kgVar": "1.55",
      "ust25": "1.72"
    },
    "details": {
      "note": "Dundalk ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "06cb5ffc-8993-4300-ad4d-3f584d952768",
    "date": "28.08.2026",
    "time": "13:30",
    "month": "Ağustos 2026",
    "league": "GKOR2",
    "country": "GKOR2",
    "homeTeam": "Ansan Greeners",
    "awayTeam": "Daegu",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "5.51",
      "msX": "4.38",
      "ms2": "1.25",
      "turnaroundOdd": "17.88",
      "kgVar": "1.43",
      "ust25": "1.26"
    },
    "details": {
      "note": "Daegu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "9d1b5706-0df3-42a1-a779-5a74a5870dc1",
    "date": "28.08.2026",
    "time": "14:35",
    "month": "Ağustos 2026",
    "league": "ÇİNSL",
    "country": "ÇİNSL",
    "homeTeam": "Shanghai Shenh",
    "awayTeam": "Shandong Taisha",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.39",
      "msX": "4.19",
      "ms2": "3.91",
      "turnaroundOdd": "48.47",
      "kgVar": "1.16",
      "ust25": "1.09"
    },
    "details": {
      "note": "Shandong Taisha ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "67e760ad-3dad-4eb3-b443-4429985a0562",
    "date": "28.08.2026",
    "time": "21:30",
    "month": "Ağustos 2026",
    "league": "T1L",
    "country": "T1L",
    "homeTeam": "Antalyaspor",
    "awayTeam": "Sarıyer",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.74",
      "msX": "2.97",
      "ms2": "3.33",
      "turnaroundOdd": "41.80",
      "kgVar": "1.60",
      "ust25": "1.73"
    },
    "details": {
      "note": "Sarıyer ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "ab4dd4da-1bea-4329-aaf5-be0e75411153",
    "date": "28.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Tamworth",
    "awayTeam": "Worthing",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.00",
      "msX": "3.26",
      "ms2": "2.48",
      "turnaroundOdd": "26.50",
      "kgVar": "1.30",
      "ust25": "1.35"
    },
    "details": {
      "note": "Tamworth ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "9ec23809-778e-4fb6-8a76-756b6e4ef711",
    "date": "27.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "TANZ",
    "country": "TANZ",
    "homeTeam": "Mashujaa",
    "awayTeam": "Kagera Sugar",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.73",
      "msX": "2.81",
      "ms2": "3.60",
      "turnaroundOdd": "23.39",
      "kgVar": "1.79",
      "ust25": "2.00"
    },
    "details": {
      "note": "Mashujaa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "53ef3324-8db2-4c30-a509-229acbd1ce2e",
    "date": "27.08.2026",
    "time": "21:30",
    "month": "Ağustos 2026",
    "league": "İS1",
    "country": "İS1",
    "homeTeam": "Celta Vigo",
    "awayTeam": "Osasuna",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.64",
      "msX": "3.05",
      "ms2": "4.24",
      "turnaroundOdd": "52.26",
      "kgVar": "1.93",
      "ust25": "2.08"
    },
    "details": {
      "note": "Osasuna ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "95a3bb87-0421-4954-aa6d-5e238ef93f37",
    "date": "27.08.2026",
    "time": "21:30",
    "month": "Ağustos 2026",
    "league": "AVKL",
    "country": "AVKL",
    "homeTeam": "Borac Banja Lu",
    "awayTeam": "Vikingur Reykja",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.85",
      "msX": "3.37",
      "ms2": "2.96",
      "turnaroundOdd": "24.78",
      "kgVar": "1.48",
      "ust25": "1.56"
    },
    "details": {
      "note": "Borac Banja Lu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "cb4aa4c9-0b98-4a70-a20d-1331bae50fb1",
    "date": "27.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Boreham Wood",
    "awayTeam": "Boston United",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.36",
      "msX": "3.94",
      "ms2": "4.51",
      "turnaroundOdd": "19.14",
      "kgVar": "1.41",
      "ust25": "1.32"
    },
    "details": {
      "note": "Boreham Wood ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "dab84295-a028-4de9-897b-e42268c6948c",
    "date": "26.08.2026",
    "time": "19:30",
    "month": "Ağustos 2026",
    "league": "ALMBÖL",
    "country": "ALMBÖL",
    "homeTeam": "Schöningen",
    "awayTeam": "Sankt Pauli Ii",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.58",
      "msX": "3.48",
      "ms2": "3.44",
      "turnaroundOdd": "21.67",
      "kgVar": "1.30"
    },
    "details": {
      "note": "Schöningen ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "38061ddc-4187-4f32-b8b4-7f56a34ce26d",
    "date": "26.08.2026",
    "time": "01:00",
    "month": "Ağustos 2026",
    "league": "ŞİL",
    "country": "ŞİL",
    "homeTeam": "Coquimbo Unido",
    "awayTeam": "Univ. Catolica",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.00",
      "msX": "2.82",
      "ms2": "2.79",
      "turnaroundOdd": "35.59",
      "kgVar": "1.67",
      "ust25": "1.90"
    },
    "details": {
      "note": "Univ. Catolica ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3e29d3c0-9a45-4423-bac8-14af168f9baf",
    "date": "26.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "NOK",
    "country": "NOK",
    "homeTeam": "Varhaug",
    "awayTeam": "Sandnes",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "8.30",
      "msX": "6.33",
      "ms2": "1.08",
      "turnaroundOdd": "15.92",
      "kgVar": "1.37"
    },
    "details": {
      "note": "Sandnes ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "cd59373c-dfd5-4466-ae08-2085c80dbfaa",
    "date": "26.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "HAZ",
    "country": "HAZ",
    "homeTeam": "Numancia",
    "awayTeam": "Utebo",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.91",
      "msX": "2.94",
      "ms2": "2.88",
      "turnaroundOdd": "25.46",
      "kgVar": "1.52",
      "ust25": "1.67"
    },
    "details": {
      "note": "Numancia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ec25ff5f-9ab4-4615-a79a-7b5fe941f492",
    "date": "26.08.2026",
    "time": "12:30",
    "month": "Ağustos 2026",
    "league": "JPK",
    "country": "JPK",
    "homeTeam": "Nagoya",
    "awayTeam": "Gainare Tottori",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.00",
      "msX": "6.19",
      "ms2": "11.10",
      "turnaroundOdd": "131.15",
      "kgVar": "1.71"
    },
    "details": {
      "note": "Gainare Tottori ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "77d9193e-ce78-4019-93e9-561138b68acb",
    "date": "26.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "JPK",
    "country": "JPK",
    "homeTeam": "Sapporo",
    "awayTeam": "Kofu",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.76",
      "msX": "2.98",
      "ms2": "3.27",
      "turnaroundOdd": "41.10",
      "kgVar": "1.57",
      "ust25": "1.70"
    },
    "details": {
      "note": "Kofu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "46f92ae7-ba28-4c72-a553-5f9b2eacbceb",
    "date": "25.08.2026",
    "time": "21:52",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Workington",
    "awayTeam": "Rylands",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.14",
      "msX": "3.02",
      "ms2": "2.42",
      "turnaroundOdd": "28.11",
      "kgVar": "1.51",
      "ust25": "1.66"
    },
    "details": {
      "note": "Workington ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "7521cf35-d3ae-4e98-82bf-28a62bd5d33f",
    "date": "25.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "İKCK",
    "country": "İKCK",
    "homeTeam": "Kelty Hearts",
    "awayTeam": "Clydebank Fc",
    "iyScore": "2 - 1",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.94",
      "msX": "3.15",
      "ms2": "2.64",
      "turnaroundOdd": "33.86",
      "kgVar": "1.37",
      "ust25": "1.44"
    },
    "details": {
      "note": "Clydebank Fc ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3fe4c9f9-2b16-4c0a-b9e9-7f837d83b807",
    "date": "25.08.2026",
    "time": "01:30",
    "month": "Ağustos 2026",
    "league": "BR2",
    "country": "BR2",
    "homeTeam": "Juventude",
    "awayTeam": "Regatas",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.87",
      "msX": "2.81",
      "ms2": "3.10",
      "turnaroundOdd": "25.01",
      "kgVar": "1.67",
      "ust25": "1.88"
    },
    "details": {
      "note": "Juventude ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "61c123ce-5e0d-4ed2-a00d-0c00f5404525",
    "date": "25.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "INGPDL",
    "country": "INGPDL",
    "homeTeam": "Millwall U21",
    "awayTeam": "Huddersfield To",
    "iyScore": "2 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.07",
      "msX": "3.47",
      "ms2": "2.27",
      "turnaroundOdd": "29.61",
      "kgVar": "1.22"
    },
    "details": {
      "note": "Huddersfield To ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5e8bd052-613c-4b4f-a354-ff2afcc9f963",
    "date": "25.08.2026",
    "time": "21:00",
    "month": "Ağustos 2026",
    "league": "SUUD",
    "country": "SUUD",
    "homeTeam": "Al Ettifaq",
    "awayTeam": "Al Nassr (Riyad",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "8.09",
      "msX": "5.85",
      "ms2": "1.09",
      "turnaroundOdd": "16.04",
      "kgVar": "1.41",
      "ust25": "1.12"
    },
    "details": {
      "note": "Al Nassr (Riyad ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "52ef2731-5a71-43de-895a-525645657abc",
    "date": "25.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İKCK",
    "country": "İKCK",
    "homeTeam": "Airdrieonians",
    "awayTeam": "Stirling Albion",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.33",
      "msX": "3.94",
      "ms2": "4.89",
      "turnaroundOdd": "59.73",
      "kgVar": "1.47",
      "ust25": "1.37"
    },
    "details": {
      "note": "Stirling Albion ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "dcff8167-d497-48a7-ad9b-c9bc11176335",
    "date": "24.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "FR2",
    "country": "FR2",
    "homeTeam": "Reims",
    "awayTeam": "Annecy",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.71",
      "msX": "3.13",
      "ms2": "3.68",
      "turnaroundOdd": "23.16",
      "kgVar": "1.72",
      "ust25": "1.85"
    },
    "details": {
      "note": "Reims ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ba0c3549-9120-4c38-b941-ca4c831bb3ff",
    "date": "24.08.2026",
    "time": "17:30",
    "month": "Ağustos 2026",
    "league": "RUS1",
    "country": "RUS1",
    "homeTeam": "Kamaz",
    "awayTeam": "Pfc Sochi",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.04",
      "msX": "2.91",
      "ms2": "1.86",
      "turnaroundOdd": "24.89",
      "kgVar": "1.62",
      "ust25": "1.79"
    },
    "details": {
      "note": "Pfc Sochi ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1fda58ba-d1b0-40b9-8efe-8c4c03326de0",
    "date": "24.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "AFK",
    "country": "AFK",
    "homeTeam": "Würzburger Kic",
    "awayTeam": "Köln",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "7.22",
      "msX": "5.15",
      "ms2": "1.14",
      "turnaroundOdd": "16.61",
      "kgVar": "1.50",
      "ust25": "1.23"
    },
    "details": {
      "note": "Köln ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "45b33da3-8830-45c2-bdff-b2b29a85932a",
    "date": "24.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "DAN",
    "country": "DAN",
    "homeTeam": "Brondby",
    "awayTeam": "Silkeborg",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.29",
      "msX": "4.47",
      "ms2": "5.74",
      "turnaroundOdd": "18.34",
      "kgVar": "1.51",
      "ust25": "1.34"
    },
    "details": {
      "note": "Brondby ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "52b3b892-eddb-4aae-9565-b9a3d2be42b3",
    "date": "23.08.2026",
    "time": "20:45",
    "month": "Ağustos 2026",
    "league": "ARJ",
    "country": "ARJ",
    "homeTeam": "Barracas",
    "awayTeam": "Platense",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.25",
      "msX": "2.46",
      "ms2": "3.06",
      "turnaroundOdd": "38.69",
      "kgVar": "2.29",
      "ust25": "2.99"
    },
    "details": {
      "note": "Platense ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "57b25be4-05fb-4009-be4d-317c9f2b2db6",
    "date": "23.08.2026",
    "time": "21:00",
    "month": "Ağustos 2026",
    "league": "ARJPBN",
    "country": "ARJPBN",
    "homeTeam": "Chacarita Juni",
    "awayTeam": "San Martin Tucu",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.11",
      "msX": "2.42",
      "ms2": "3.08",
      "turnaroundOdd": "38.92",
      "kgVar": "2.19"
    },
    "details": {
      "note": "San Martin Tucu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "cedd7135-f272-452a-b41a-d4d2bc4d242d",
    "date": "23.08.2026",
    "time": "21:15",
    "month": "Ağustos 2026",
    "league": "SLVN",
    "country": "SLVN",
    "homeTeam": "Maribor",
    "awayTeam": "Ask Bravo",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.37",
      "msX": "3.84",
      "ms2": "4.57",
      "turnaroundOdd": "19.26",
      "kgVar": "1.44",
      "ust25": "1.35"
    },
    "details": {
      "note": "Maribor ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "17c68353-aa74-43c4-84e5-ad1e8b6f084d",
    "date": "23.08.2026",
    "time": "21:30",
    "month": "Ağustos 2026",
    "league": "İTSKK",
    "country": "İTSKK",
    "homeTeam": "Lazio (K)",
    "awayTeam": "Napoli (K)",
    "iyScore": "1 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.15",
      "msX": "2.81",
      "ms2": "2.56",
      "turnaroundOdd": "28.22",
      "kgVar": "1.56",
      "ust25": "1.75"
    },
    "details": {
      "note": "Lazio (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "111e8584-16d4-49d5-a990-ec11458f6484",
    "date": "23.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "İTB",
    "country": "İTB",
    "homeTeam": "Verona",
    "awayTeam": "Ascoli Picchio",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.55",
      "msX": "3.20",
      "ms2": "4.55",
      "turnaroundOdd": "55.82",
      "kgVar": "1.70",
      "ust25": "1.75"
    },
    "details": {
      "note": "Ascoli Picchio ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "67f5cd80-756f-4596-82b8-611d73c1c6ab",
    "date": "23.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "MSR",
    "country": "MSR",
    "homeTeam": "Ceramica Cleop",
    "awayTeam": "Al Qanah",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.69",
      "msX": "2.73",
      "ms2": "3.96",
      "turnaroundOdd": "49.04",
      "kgVar": "1.93",
      "ust25": "2.17"
    },
    "details": {
      "note": "Al Qanah ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "133ade90-dd4a-446d-85c4-801ef2c46ed9",
    "date": "23.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "MSR",
    "country": "MSR",
    "homeTeam": "Al Ahly",
    "awayTeam": "Enppi",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.16",
      "msX": "3.98",
      "ms2": "9.71",
      "turnaroundOdd": "16.84",
      "kgVar": "2.66",
      "ust25": "2.01"
    },
    "details": {
      "note": "Al Ahly ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ffec55a1-29cf-47a3-95a0-a4e7dfe548d8",
    "date": "23.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "KOL",
    "country": "KOL",
    "homeTeam": "Fortaleza",
    "awayTeam": "Atletico Nacion",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "4.52",
      "msX": "3.19",
      "ms2": "1.48",
      "turnaroundOdd": "20.52",
      "kgVar": "1.76",
      "ust25": "1.79"
    },
    "details": {
      "note": "Atletico Nacion ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5fda3cf0-4510-4929-bc98-a2271e5b5f61",
    "date": "23.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "ARJPBN",
    "country": "ARJPBN",
    "homeTeam": "Atl Temperley",
    "awayTeam": "Midland",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.10",
      "msX": "2.43",
      "ms2": "3.08",
      "turnaroundOdd": "27.65",
      "kgVar": "2.17"
    },
    "details": {
      "note": "Atl Temperley ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "70155a3c-3da5-4067-8234-4d4513caa09a",
    "date": "23.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "ALMBÖL",
    "country": "ALMBÖL",
    "homeTeam": "Norderstedt",
    "awayTeam": "Weiche Flensbur",
    "iyScore": "1 - 0",
    "msScore": "1 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.75",
      "msX": "3.43",
      "ms2": "1.80",
      "turnaroundOdd": "24.20",
      "kgVar": "1.23"
    },
    "details": {
      "note": "Weiche Flensbur ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5d6c8211-5095-4c54-8c51-9e51d872c376",
    "date": "23.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "INGPL2",
    "country": "INGPL2",
    "homeTeam": "Leeds United U",
    "awayTeam": "West Brom (B)",
    "iyScore": "1 - 2",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.21",
      "msX": "3.39",
      "ms2": "2.15",
      "turnaroundOdd": "28.91",
      "kgVar": "1.24"
    },
    "details": {
      "note": "Leeds United U ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "be506d0f-e30f-4825-a939-87bd04212262",
    "date": "23.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "FİN",
    "country": "FİN",
    "homeTeam": "Helsinki",
    "awayTeam": "Gnistan",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.44",
      "msX": "3.93",
      "ms2": "4.35",
      "turnaroundOdd": "53.52",
      "kgVar": "1.42",
      "ust25": "1.35"
    },
    "details": {
      "note": "Gnistan ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7cddffed-8cf6-4c79-9bbe-3c7d19c8a0ad",
    "date": "23.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "İNP",
    "country": "İNP",
    "homeTeam": "Manchester Cit",
    "awayTeam": "Bournemouth",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.30",
      "msX": "4.38",
      "ms2": "5.55",
      "turnaroundOdd": "18.45",
      "kgVar": "1.52",
      "ust25": "1.37"
    },
    "details": {
      "note": "Manchester Cit ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f686c056-e304-494d-a1b1-eb8eeb3df604",
    "date": "23.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Helges",
    "awayTeam": "Falu Bs",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "7.88",
      "msX": "5.29",
      "ms2": "1.12",
      "turnaroundOdd": "16.38"
    },
    "details": {
      "note": "Falu Bs ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6a9dbe6d-36f9-42dd-ada6-771feb7c141b",
    "date": "22.08.2026",
    "time": "21:30",
    "month": "Ağustos 2026",
    "league": "İSV",
    "country": "İSV",
    "homeTeam": "Zurich",
    "awayTeam": "Basel",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.49",
      "msX": "3.31",
      "ms2": "2.12",
      "turnaroundOdd": "27.88",
      "kgVar": "1.34",
      "ust25": "1.40"
    },
    "details": {
      "note": "Basel ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "35f60bfe-8c00-45ed-8bbe-58b016203ae8",
    "date": "22.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "İTB",
    "country": "İTB",
    "homeTeam": "Avellino",
    "awayTeam": "Arezzo",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.93",
      "msX": "2.88",
      "ms2": "3.22",
      "turnaroundOdd": "40.53",
      "kgVar": "1.76",
      "ust25": "2.00"
    },
    "details": {
      "note": "Arezzo ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1afb3d03-afce-4431-a45a-60220ffb389c",
    "date": "22.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "BR1",
    "country": "BR1",
    "homeTeam": "Fluminense",
    "awayTeam": "Remo",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.34",
      "msX": "3.73",
      "ms2": "6.20",
      "turnaroundOdd": "18.91",
      "kgVar": "2.01",
      "ust25": "1.85"
    },
    "details": {
      "note": "Fluminense ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "1e91a352-9c7b-43ce-b50d-ec7e7b069896",
    "date": "22.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "İTB",
    "country": "İTB",
    "homeTeam": "Benevento",
    "awayTeam": "Modena",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.20",
      "msX": "2.93",
      "ms2": "2.63",
      "turnaroundOdd": "33.74",
      "kgVar": "1.58",
      "ust25": "1.78"
    },
    "details": {
      "note": "Modena ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "18ec9ce8-e305-4f92-a909-4f7efb793e8c",
    "date": "22.08.2026",
    "time": "00:30",
    "month": "Ağustos 2026",
    "league": "EKV1",
    "country": "EKV1",
    "homeTeam": "T.Universitari",
    "awayTeam": "Guayaquil City",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.65",
      "msX": "2.84",
      "ms2": "3.93",
      "turnaroundOdd": "48.70",
      "kgVar": "1.98",
      "ust25": "2.20"
    },
    "details": {
      "note": "Guayaquil City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "2e30f0e4-4da1-459d-9e83-106118b58c98",
    "date": "22.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "BR1",
    "country": "BR1",
    "homeTeam": "Cruzeiro",
    "awayTeam": "Flamengo",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.16",
      "msX": "3.01",
      "ms2": "1.89",
      "turnaroundOdd": "39.84",
      "kgVar": "1.58",
      "ust25": "1.73"
    },
    "details": {
      "note": "Cruzeiro ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "286031c7-a392-4e81-b768-39a651a26415",
    "date": "22.08.2026",
    "time": "16:30",
    "month": "Ağustos 2026",
    "league": "GALFAW",
    "country": "GALFAW",
    "homeTeam": "Carmarthen",
    "awayTeam": "Treowen Stars",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.59",
      "msX": "3.58",
      "ms2": "3.29",
      "turnaroundOdd": "41.34",
      "kgVar": "1.26"
    },
    "details": {
      "note": "Treowen Stars ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8f0b31b8-98c8-40ba-b5fe-4e004368a19b",
    "date": "22.08.2026",
    "time": "06:00",
    "month": "Ağustos 2026",
    "league": "USL1",
    "country": "USL1",
    "homeTeam": "Alta",
    "awayTeam": "Naples",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.83",
      "msX": "3.07",
      "ms2": "2.97",
      "turnaroundOdd": "37.66",
      "kgVar": "1.43",
      "ust25": "1.51"
    },
    "details": {
      "note": "Naples ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "21ea185a-e9a8-4d2b-8bd7-492dfc433d51",
    "date": "22.08.2026",
    "time": "06:00",
    "month": "Ağustos 2026",
    "league": "AVNSW",
    "country": "AVNSW",
    "homeTeam": "Edgeworth Eagl",
    "awayTeam": "Belmont Swansea",
    "iyScore": "0 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.51",
      "msX": "3.82",
      "ms2": "3.45",
      "turnaroundOdd": "20.86",
      "kgVar": "1.27",
      "ust25": "1.23"
    },
    "details": {
      "note": "Edgeworth Eagl ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "05932a49-9794-4e40-bc6f-52c0560ad5e2",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İN2",
    "country": "İN2",
    "homeTeam": "Colchester",
    "awayTeam": "Oldham",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.32",
      "msX": "2.94",
      "ms2": "2.27",
      "turnaroundOdd": "30.18",
      "kgVar": "1.51",
      "ust25": "1.67"
    },
    "details": {
      "note": "Colchester ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "92897835-f6aa-4e25-9adb-f03bf43d5b9a",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNCL",
    "country": "İNCL",
    "homeTeam": "Blackburn",
    "awayTeam": "Middlesbrough",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.37",
      "msX": "3.26",
      "ms2": "1.75",
      "turnaroundOdd": "42.26",
      "kgVar": "1.56",
      "ust25": "1.65"
    },
    "details": {
      "note": "Blackburn ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "a5a7446f-fd95-48b4-8846-2ba79c99ae59",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Salisbury",
    "awayTeam": "Hemel",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.20",
      "msX": "2.98",
      "ms2": "2.38",
      "turnaroundOdd": "30.87",
      "kgVar": "1.46",
      "ust25": "1.59"
    },
    "details": {
      "note": "Hemel ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "32d8a41b-7e12-413c-b085-e9c455d5853b",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "NOK",
    "country": "NOK",
    "homeTeam": "Lokomotiv Oslo",
    "awayTeam": "Grorud Il",
    "iyScore": "1 - 0",
    "msScore": "1 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "14.50",
      "msX": "7.13",
      "ms2": "1.00",
      "turnaroundOdd": "15.00",
      "kgVar": "1.82"
    },
    "details": {
      "note": "Grorud Il ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "dfda8572-e72f-4bb3-aa75-6c5eb6a0d171",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "LET",
    "country": "LET",
    "homeTeam": "Ogre United",
    "awayTeam": "Fs Jelgava",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "3.40",
      "msX": "3.35",
      "ms2": "1.62",
      "turnaroundOdd": "22.13",
      "kgVar": "1.43",
      "ust25": "1.45"
    },
    "details": {
      "note": "Fs Jelgava ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e53fef3b-5d7a-48c3-af8d-9668df9b2e52",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Macclesfield",
    "awayTeam": "Brackley Town",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.51",
      "msX": "3.31",
      "ms2": "4.07",
      "turnaroundOdd": "20.86",
      "kgVar": "1.61",
      "ust25": "1.63"
    },
    "details": {
      "note": "Macclesfield ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d6a358e0-f643-43fe-9f51-81828a1b114d",
    "date": "22.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "GUR",
    "country": "GUR",
    "homeTeam": "Spaeri",
    "awayTeam": "Samgurali",
    "iyScore": "3 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.42",
      "msX": "2.88",
      "ms2": "2.22",
      "turnaroundOdd": "29.03",
      "kgVar": "1.50",
      "ust25": "1.66"
    },
    "details": {
      "note": "Samgurali ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "99ca10c3-0561-43c3-a8e6-28a50cf27a21",
    "date": "22.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "MAC2",
    "country": "MAC2",
    "homeTeam": "Kozarmisleny",
    "awayTeam": "Szeged 2011",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.86",
      "msX": "2.86",
      "ms2": "1.95",
      "turnaroundOdd": "25.93",
      "kgVar": "1.72",
      "ust25": "1.95"
    },
    "details": {
      "note": "Szeged 2011 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b544e964-f0f5-458c-911a-da1fcadaa01e",
    "date": "22.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "ABD",
    "country": "ABD",
    "homeTeam": "Orlando City",
    "awayTeam": "Salt Lake",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.55",
      "msX": "3.89",
      "ms2": "3.66",
      "turnaroundOdd": "21.32",
      "kgVar": "1.30",
      "ust25": "1.25"
    },
    "details": {
      "note": "Orlando City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "a6acc46a-04fa-475e-a482-0255591e66a5",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Leek Town",
    "awayTeam": "Bamber Bridge",
    "iyScore": "0 - 1",
    "msScore": "4 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.72",
      "msX": "3.24",
      "ms2": "3.14",
      "turnaroundOdd": "23.28",
      "kgVar": "1.48",
      "ust25": "1.55"
    },
    "details": {
      "note": "Leek Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "51481811-55c4-4108-8eb3-5ef086091a9a",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Lynn Town",
    "awayTeam": "Marine",
    "iyScore": "1 - 0",
    "msScore": "1 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.48",
      "msX": "3.44",
      "ms2": "4.10",
      "turnaroundOdd": "50.65",
      "kgVar": "1.53",
      "ust25": "1.51"
    },
    "details": {
      "note": "Marine ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "afda40e3-ad5d-461f-9b1a-d5fe75dda399",
    "date": "22.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Harborough Tow",
    "awayTeam": "Darlington 1883",
    "iyScore": "1 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.65",
      "msX": "3.30",
      "ms2": "3.34",
      "turnaroundOdd": "22.47",
      "kgVar": "1.37",
      "ust25": "1.40"
    },
    "details": {
      "note": "Harborough Tow ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fdd83884-f488-4553-928f-2eb95921cbaa",
    "date": "22.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "JWEL",
    "country": "JWEL",
    "homeTeam": "Inac Kobe Leon",
    "awayTeam": "Sanfrecce Hiros",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.21",
      "msX": "2.76",
      "ms2": "2.53",
      "turnaroundOdd": "28.91",
      "kgVar": "1.80",
      "ust25": "2.12"
    },
    "details": {
      "note": "Inac Kobe Leon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c7acfcc1-8756-4145-a09f-28fe91dee222",
    "date": "22.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "GK3L",
    "country": "GK3L",
    "homeTeam": "Dangjin Citize",
    "awayTeam": "Yeoju Sejong",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.87",
      "msX": "3.03",
      "ms2": "2.89",
      "turnaroundOdd": "36.73",
      "kgVar": "1.49",
      "ust25": "1.61"
    },
    "details": {
      "note": "Yeoju Sejong ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e5ab391c-915d-44ea-9f82-51822665f081",
    "date": "22.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "JAP2",
    "country": "JAP2",
    "homeTeam": "Sagan Tosu",
    "awayTeam": "Tochigi City",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.78",
      "msX": "2.97",
      "ms2": "3.22",
      "turnaroundOdd": "40.53",
      "kgVar": "1.56",
      "ust25": "1.69"
    },
    "details": {
      "note": "Tochigi City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8af9972f-7551-49d8-92b0-8ba1aad76689",
    "date": "22.08.2026",
    "time": "13:30",
    "month": "Ağustos 2026",
    "league": "GKOR2",
    "country": "GKOR2",
    "homeTeam": "Ansan Greeners",
    "awayTeam": "Seongnam",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "4.12",
      "msX": "3.13",
      "ms2": "1.54",
      "turnaroundOdd": "21.21",
      "kgVar": "1.68",
      "ust25": "1.74"
    },
    "details": {
      "note": "Seongnam ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6b4477d5-e1e1-400d-9d1d-fd25c8aef397",
    "date": "22.08.2026",
    "time": "14:30",
    "month": "Ağustos 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Woking",
    "awayTeam": "Afc Fylde",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.32",
      "msX": "3.03",
      "ms2": "2.22",
      "turnaroundOdd": "30.18",
      "kgVar": "1.38",
      "ust25": "1.49"
    },
    "details": {
      "note": "Woking ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "82090dd5-5004-4ecf-a5d6-4fb6fd6641ce",
    "date": "22.08.2026",
    "time": "22:00",
    "month": "Ağustos 2026",
    "league": "HIR",
    "country": "HIR",
    "homeTeam": "Dinamo Zagreb",
    "awayTeam": "Varazdin",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.36",
      "msX": "3.83",
      "ms2": "4.66",
      "turnaroundOdd": "19.14",
      "kgVar": "1.51",
      "ust25": "1.42"
    },
    "details": {
      "note": "Dinamo Zagreb ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "9a81b0e7-bfbe-4e18-abba-a24585c949d7",
    "date": "22.08.2026",
    "time": "14:35",
    "month": "Ağustos 2026",
    "league": "ÇİNSL",
    "country": "ÇİNSL",
    "homeTeam": "Chengdu Ron.",
    "awayTeam": "Shanghai Shenhu",
    "iyScore": "2 - 1",
    "msScore": "4 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "1.63",
      "msX": "3.56",
      "ms2": "3.18",
      "turnaroundOdd": "40.07",
      "kgVar": "1.23",
      "ust25": "1.22"
    },
    "details": {
      "note": "Shanghai Shenhu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a73816f9-50a6-4a86-be1c-c77316118221",
    "date": "22.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "ALKB",
    "country": "ALKB",
    "homeTeam": "Nürnberg (K)",
    "awayTeam": "Wolfsburg (K)",
    "iyScore": "2 - 0",
    "msScore": "2 - 8",
    "type": "1/2",
    "odds": {
      "ms1": "8.84",
      "msX": "6.01",
      "ms2": "1.08",
      "turnaroundOdd": "15.92",
      "kgVar": "1.48"
    },
    "details": {
      "note": "Wolfsburg (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "02b5d415-5897-4d3a-9c64-14656928ae00",
    "date": "22.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "FR2",
    "country": "FR2",
    "homeTeam": "Nantes",
    "awayTeam": "Rodez Aveyron",
    "iyScore": "2 - 1",
    "msScore": "2 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "1.66",
      "msX": "3.33",
      "ms2": "3.62",
      "turnaroundOdd": "45.13",
      "kgVar": "1.54",
      "ust25": "1.59"
    },
    "details": {
      "note": "Rodez Aveyron ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "454344c5-69af-4964-829c-fe17a93eed55",
    "date": "20.08.2026",
    "time": "16:30",
    "month": "Ağustos 2026",
    "league": "MSR2",
    "country": "MSR2",
    "homeTeam": "El Mansura",
    "awayTeam": "Baladiyyat",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.49",
      "msX": "2.37",
      "ms2": "2.56",
      "turnaroundOdd": "32.14",
      "kgVar": "1.99"
    },
    "details": {
      "note": "El Mansura ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e9ecae71-2715-4b6f-affe-dfd225fd494b",
    "date": "20.08.2026",
    "time": "21:15",
    "month": "Ağustos 2026",
    "league": "AVKL",
    "country": "AVKL",
    "homeTeam": "Sion",
    "awayTeam": "Ajax",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "3.28",
      "msX": "3.63",
      "ms2": "1.68",
      "turnaroundOdd": "22.82",
      "kgVar": "1.39",
      "ust25": "1.40"
    },
    "details": {
      "note": "Ajax ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "0a33e4d7-acce-4397-af38-3f4f69309ac9",
    "date": "19.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "GKOK",
    "country": "GKOK",
    "homeTeam": "Gimpo Citizen",
    "awayTeam": "Gimcheon Sangmu",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.20",
      "msX": "2.90",
      "ms2": "2.43",
      "turnaroundOdd": "28.80",
      "kgVar": "1.57",
      "ust25": "1.75"
    },
    "details": {
      "note": "Gimpo Citizen ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "5d4e6051-4c26-4195-9c45-e18cc538075a",
    "date": "19.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "GKOK",
    "country": "GKOK",
    "homeTeam": "Pohang Steeler",
    "awayTeam": "Jinju Citizen",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.23",
      "msX": "4.33",
      "ms2": "6.09",
      "turnaroundOdd": "17.64",
      "kgVar": "1.65",
      "ust25": "1.43"
    },
    "details": {
      "note": "Pohang Steeler ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b7a6e582-c9c4-4e2e-afc4-18111d405da6",
    "date": "19.08.2026",
    "time": "13:30",
    "month": "Ağustos 2026",
    "league": "GKOK",
    "country": "GKOK",
    "homeTeam": "Anyang",
    "awayTeam": "Jeju Utd",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.27",
      "msX": "3.00",
      "ms2": "2.29",
      "turnaroundOdd": "29.61",
      "kgVar": "1.49",
      "ust25": "1.62"
    },
    "details": {
      "note": "Anyang ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "65f4dd2a-0c69-4b76-91ee-ae082c61002a",
    "date": "19.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "IRAN",
    "country": "IRAN",
    "homeTeam": "Malavan Fc",
    "awayTeam": "Zob Ahan Fc",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.94",
      "msX": "2.40",
      "ms2": "3.57",
      "turnaroundOdd": "25.81"
    },
    "details": {
      "note": "Malavan Fc ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ae92e44d-5787-44a7-9547-6479e6e7377f",
    "date": "19.08.2026",
    "time": "19:30",
    "month": "Ağustos 2026",
    "league": "ALMBÖL",
    "country": "ALMBÖL",
    "homeTeam": "Werder Bremen",
    "awayTeam": "Weiche Flensbur",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.70",
      "msX": "3.42",
      "ms2": "1.82",
      "turnaroundOdd": "24.43",
      "kgVar": "1.19"
    },
    "details": {
      "note": "Weiche Flensbur ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "341d8726-9ebb-42e0-a5d2-c96fbf3c221a",
    "date": "19.08.2026",
    "time": "19:30",
    "month": "Ağustos 2026",
    "league": "RUS1",
    "country": "RUS1",
    "homeTeam": "Veles",
    "awayTeam": "Olimpiyets",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "4.10",
      "msX": "3.12",
      "ms2": "1.55",
      "turnaroundOdd": "50.65",
      "kgVar": "1.70",
      "ust25": "1.76"
    },
    "details": {
      "note": "Veles ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "4e030a5e-6e6c-4c76-bbde-4e7894196a38",
    "date": "18.08.2026",
    "time": "21:30",
    "month": "Ağustos 2026",
    "league": "İULK",
    "country": "İULK",
    "homeTeam": "Worthing",
    "awayTeam": "West Ham (B)",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.10",
      "msX": "3.37",
      "ms2": "2.28",
      "turnaroundOdd": "29.72",
      "kgVar": "1.24"
    },
    "details": {
      "note": "West Ham (B) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "df4487d5-eeac-4400-a8eb-88d28aab5f74",
    "date": "18.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "HAZ",
    "country": "HAZ",
    "homeTeam": "Heidenheim",
    "awayTeam": "B.Münih",
    "iyScore": "2 - 1",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "6.09",
      "msX": "5.41",
      "ms2": "1.21",
      "turnaroundOdd": "17.41",
      "kgVar": "1.24",
      "ust25": "1.08"
    },
    "details": {
      "note": "B.Münih ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8b40d791-11e0-4948-ae23-1efe9bc121cb",
    "date": "18.08.2026",
    "time": "21:00",
    "month": "Ağustos 2026",
    "league": "İULK",
    "country": "İULK",
    "homeTeam": "Boston United",
    "awayTeam": "Birmingham City",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.40",
      "msX": "3.79",
      "ms2": "4.29",
      "turnaroundOdd": "52.84",
      "kgVar": "1.31"
    },
    "details": {
      "note": "Birmingham City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "2b6b98ae-4829-4e76-a80c-33cc1b373581",
    "date": "17.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "UKR",
    "country": "UKR",
    "homeTeam": "Polessya",
    "awayTeam": "Zoria Luhansk",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.26",
      "msX": "3.96",
      "ms2": "6.04",
      "turnaroundOdd": "72.96",
      "kgVar": "1.73",
      "ust25": "1.53"
    },
    "details": {
      "note": "Zoria Luhansk ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5375d702-6b73-474e-bdc2-6cce30f4c047",
    "date": "16.08.2026",
    "time": "13:30",
    "month": "Ağustos 2026",
    "league": "GKOR2",
    "country": "GKOR2",
    "homeTeam": "Paju Citizen",
    "awayTeam": "Seongnam",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.92",
      "msX": "2.71",
      "ms2": "1.95",
      "turnaroundOdd": "37.08",
      "kgVar": "1.77",
      "ust25": "2.05"
    },
    "details": {
      "note": "Paju Citizen ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "9a569fa2-6627-4c16-a4c2-7d04a3208cda",
    "date": "16.08.2026",
    "time": "19:45",
    "month": "Ağustos 2026",
    "league": "BAE",
    "country": "BAE",
    "homeTeam": "Banniyas",
    "awayTeam": "Al Ain",
    "iyScore": "2 - 1",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "8.02",
      "msX": "4.84",
      "ms2": "1.12",
      "turnaroundOdd": "16.38",
      "kgVar": "1.69",
      "ust25": "1.33"
    },
    "details": {
      "note": "Al Ain ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "1ee3ac80-2fd2-4b26-8ef6-022dfd25ce47",
    "date": "16.08.2026",
    "time": "21:15",
    "month": "Ağustos 2026",
    "league": "BUL1",
    "country": "BUL1",
    "homeTeam": "Lokomotiv Plov",
    "awayTeam": "Dunav 2010",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.46",
      "msX": "3.11",
      "ms2": "4.55",
      "turnaroundOdd": "55.82",
      "kgVar": "1.85",
      "ust25": "1.89"
    },
    "details": {
      "note": "Dunav 2010 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "68afbd73-33ba-41d6-bcf0-992858f18749",
    "date": "16.08.2026",
    "time": "01:00",
    "month": "Ağustos 2026",
    "league": "ABD",
    "country": "ABD",
    "homeTeam": "New York City",
    "awayTeam": "Philadelphia",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.34",
      "msX": "3.21",
      "ms2": "2.21",
      "turnaroundOdd": "28.91",
      "kgVar": "1.37",
      "ust25": "1.45"
    },
    "details": {
      "note": "Philadelphia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f474281c-753b-4f6d-b46a-abe37c6e96e7",
    "date": "16.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "Polonya : Ekstraklasa",
    "country": "Polonya",
    "homeTeam": "Cracovia",
    "awayTeam": "Rakow C.",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.14",
      "msX": "2.77",
      "ms2": "2.52",
      "turnaroundOdd": "28.11",
      "kgVar": "1.57",
      "ust25": "1.78"
    },
    "details": {
      "note": "Cracovia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c4a2e13d-034d-4f64-a182-9f452ff720d2",
    "date": "16.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "Malta : Premier Lig",
    "country": "Malta",
    "homeTeam": "Valletta",
    "awayTeam": "St. Patrick",
    "iyScore": "1 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.51",
      "msX": "3.08",
      "ms2": "4.23",
      "turnaroundOdd": "20.86",
      "kgVar": "1.77",
      "ust25": "1.83"
    },
    "details": {
      "note": "Valletta ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "5524f9da-7dd7-435a-b61b-34eb8a49fb9c",
    "date": "16.08.2026",
    "time": "19:45",
    "month": "Ağustos 2026",
    "league": "BAE : Körfez Ligi",
    "country": "BAE",
    "homeTeam": "Baniyas",
    "awayTeam": "Al Ain",
    "iyScore": "2 - 1",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "8.02",
      "msX": "4.84",
      "ms2": "1.12",
      "turnaroundOdd": "16.38",
      "kgVar": "1.69",
      "ust25": "1.33"
    },
    "details": {
      "note": "Al Ain ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e92a51a5-9186-473f-9840-0de53d6b818c",
    "date": "16.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "Norveç : 3. Lig",
    "country": "Norveç",
    "homeTeam": "Valerenga II",
    "awayTeam": "Ready",
    "iyScore": "1 - 2",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.11",
      "msX": "3.94",
      "ms2": "2.01",
      "turnaroundOdd": "27.76"
    },
    "details": {
      "note": "Valerenga II ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "48c901e1-110f-47e3-b6ae-4ec52f89bb94",
    "date": "16.08.2026",
    "time": "21:15",
    "month": "Ağustos 2026",
    "league": "Bulgaristan : 1. Lig",
    "country": "Bulgaristan",
    "homeTeam": "Lok Plovdiv",
    "awayTeam": "Dunav",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.46",
      "msX": "3.11",
      "ms2": "4.55",
      "turnaroundOdd": "55.82",
      "kgVar": "1.85",
      "ust25": "1.89"
    },
    "details": {
      "note": "Dunav ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e6772da9-c728-42af-8727-b349085a0dec",
    "date": "16.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "MAC3",
    "country": "MAC3",
    "homeTeam": "Vasas Ii",
    "awayTeam": "Ujpest Ii",
    "iyScore": "2 - 1",
    "msScore": "3 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "1.80",
      "msX": "3.35",
      "ms2": "2.70",
      "turnaroundOdd": "34.55",
      "kgVar": "1.39",
      "ust25": "1.44"
    },
    "details": {
      "note": "Ujpest Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "58860780-0d98-45d5-81be-78d907ea2cb5",
    "date": "16.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "JAP3",
    "country": "JAP3",
    "homeTeam": "Matsumoto Yama",
    "awayTeam": "Mio Biwako Shig",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.66",
      "msX": "2.96",
      "ms2": "3.51",
      "turnaroundOdd": "43.86",
      "kgVar": "1.64",
      "ust25": "1.77"
    },
    "details": {
      "note": "Mio Biwako Shig ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "9beb1d19-2833-4b97-a43a-cda3ce28fe61",
    "date": "16.08.2026",
    "time": "17:45",
    "month": "Ağustos 2026",
    "league": "HOLK1",
    "country": "HOLK1",
    "homeTeam": "Heerenveen (K)",
    "awayTeam": "Feyenoord (K)",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "4.60",
      "msX": "4.07",
      "ms2": "1.31",
      "turnaroundOdd": "18.57",
      "kgVar": "1.43"
    },
    "details": {
      "note": "Feyenoord (K) ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fded444a-4cfd-4bd8-9108-d3eeb0a00a8c",
    "date": "16.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "POL",
    "country": "POL",
    "homeTeam": "Cracovia Krako",
    "awayTeam": "Rakow Czestocho",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.14",
      "msX": "2.77",
      "ms2": "2.52",
      "turnaroundOdd": "28.11",
      "kgVar": "1.57",
      "ust25": "1.78"
    },
    "details": {
      "note": "Cracovia Krako ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "4c1f5ec1-794d-4f2d-872f-d3b748045c55",
    "date": "16.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "MLTP",
    "country": "MLTP",
    "homeTeam": "Valletta",
    "awayTeam": "Zabbar St Patri",
    "iyScore": "1 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.51",
      "msX": "3.08",
      "ms2": "4.23",
      "turnaroundOdd": "20.86",
      "kgVar": "1.77",
      "ust25": "1.83"
    },
    "details": {
      "note": "Valletta ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d7152759-3805-4dec-a423-bf24eefad86e",
    "date": "16.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Valerenga Ii",
    "awayTeam": "If Ready",
    "iyScore": "1 - 2",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.11",
      "msX": "3.94",
      "ms2": "2.01",
      "turnaroundOdd": "27.76",
      "kgVar": "1.00"
    },
    "details": {
      "note": "Valerenga Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f939e792-d0c4-4b80-9d0f-c9c69ec36bfb",
    "date": "16.08.2026",
    "time": "00:00",
    "month": "Ağustos 2026",
    "league": "Arjantin : Birinci Ulusal Lig",
    "country": "Arjantin",
    "homeTeam": "Godoy Cruz",
    "awayTeam": "CD Maipu",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.52",
      "msX": "2.86",
      "ms2": "4.55",
      "turnaroundOdd": "55.82",
      "kgVar": "2.04",
      "ust25": "2.19"
    },
    "details": {
      "note": "CD Maipu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6fcde1f5-e8ac-486e-b029-626d1e371237",
    "date": "16.08.2026",
    "time": "00:00",
    "month": "Ağustos 2026",
    "league": "Kanada : Premier Lig",
    "country": "Kanada",
    "homeTeam": "Cavalry",
    "awayTeam": "Forge FC",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.14",
      "msX": "2.69",
      "ms2": "2.60",
      "turnaroundOdd": "28.11",
      "kgVar": "1.61",
      "ust25": "1.86"
    },
    "details": {
      "note": "Cavalry ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "5f47f679-8205-4208-a57d-373c5bec3331",
    "date": "16.08.2026",
    "time": "00:30",
    "month": "Ağustos 2026",
    "league": "El Salvador : Premier Lig",
    "country": "El Salvador",
    "homeTeam": "Aguila",
    "awayTeam": "Atlético Balboa",
    "iyScore": "2 - 1",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.36",
      "msX": "3.45",
      "ms2": "5.03",
      "turnaroundOdd": "61.35",
      "kgVar": "1.71",
      "ust25": "1.63"
    },
    "details": {
      "note": "Atlético Balboa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3dc75279-3a2b-43b0-9fe6-5d76dc557b15",
    "date": "16.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "ABD : MLS",
    "country": "ABD",
    "homeTeam": "Atlanta Utd",
    "awayTeam": "NY Red Bulls",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.82",
      "msX": "3.55",
      "ms2": "2.79",
      "turnaroundOdd": "24.43",
      "kgVar": "1.24",
      "ust25": "1.25"
    },
    "details": {
      "note": "Atlanta Utd ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "0693b2c0-63d8-4cea-ad1f-f7ed34e173c0",
    "date": "16.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "ABD : USL 1. Lig",
    "country": "ABD",
    "homeTeam": "Fort Wayne",
    "awayTeam": "C. Red Wolves",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.77",
      "msX": "3.08",
      "ms2": "2.98",
      "turnaroundOdd": "37.77",
      "kgVar": "1.38",
      "ust25": "1.45"
    },
    "details": {
      "note": "C. Red Wolves ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3a0ffeb4-aee1-4aa7-b8e5-d67cef8e62d6",
    "date": "16.08.2026",
    "time": "04:00",
    "month": "Ağustos 2026",
    "league": "ABD : USL 1. Lig",
    "country": "ABD",
    "homeTeam": "Velocity",
    "awayTeam": "Corpus Christi",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.56",
      "msX": "3.05",
      "ms2": "3.88",
      "turnaroundOdd": "48.12",
      "kgVar": "1.60",
      "ust25": "1.67"
    },
    "details": {
      "note": "Corpus Christi ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "53ac91ef-d20e-4505-a21f-5b5e06580cc0",
    "date": "16.08.2026",
    "time": "05:30",
    "month": "Ağustos 2026",
    "league": "ABD : USL",
    "country": "ABD",
    "homeTeam": "Las Vegas L.",
    "awayTeam": "Brooklyn",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.63",
      "msX": "3.25",
      "ms2": "3.28",
      "turnaroundOdd": "22.24",
      "kgVar": "1.38",
      "ust25": "1.40"
    },
    "details": {
      "note": "Las Vegas L. ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c7f08fbe-eb64-4b74-ad98-56a00845028d",
    "date": "16.08.2026",
    "time": "07:00",
    "month": "Ağustos 2026",
    "league": "Avustralya : Ulusal Premier Lig Kuzey",
    "country": "Avustralya",
    "homeTeam": "Belmont",
    "awayTeam": "Rosebuds",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.18",
      "msX": "3.26",
      "ms2": "2.18",
      "turnaroundOdd": "28.57",
      "kgVar": "1.14"
    },
    "details": {
      "note": "Rosebuds ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e134e397-d978-457c-9d71-be3ab484dbe9",
    "date": "16.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "Macaristan : NB III",
    "country": "Macaristan",
    "homeTeam": "Vasas II",
    "awayTeam": "Ujpest II",
    "iyScore": "2 - 1",
    "msScore": "3 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "1.83",
      "msX": "3.24",
      "ms2": "2.69",
      "turnaroundOdd": "34.44",
      "kgVar": "1.38",
      "ust25": "1.44"
    },
    "details": {
      "note": "Ujpest II ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3551e9ab-a44d-4536-a368-b9f87c960b08",
    "date": "16.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "Japonya : J3 Lig",
    "country": "Japonya",
    "homeTeam": "Matsumoto Y.",
    "awayTeam": "Biwako Shiga",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.66",
      "msX": "2.96",
      "ms2": "3.51",
      "turnaroundOdd": "43.86",
      "kgVar": "1.64",
      "ust25": "1.77"
    },
    "details": {
      "note": "Biwako Shiga ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "d183df0c-9704-4973-87d1-5169471e26a5",
    "date": "16.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "İrlanda Cumhuriyeti : FAI Kupası",
    "country": "İrlanda Cumhuriyeti",
    "homeTeam": "St. Patrick's",
    "awayTeam": "Shamrock R.",
    "iyScore": "0 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.70",
      "msX": "3.04",
      "ms2": "3.24",
      "turnaroundOdd": "23.05",
      "kgVar": "1.51",
      "ust25": "1.60"
    },
    "details": {
      "note": "St. Patrick's ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "85d2524b-51cc-4577-a497-42f1b6b78e20",
    "date": "16.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "FİN",
    "country": "FİN",
    "homeTeam": "Oulu",
    "awayTeam": "Inter Turku",
    "iyScore": "2 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.66",
      "msX": "2.95",
      "ms2": "2.10",
      "turnaroundOdd": "27.65",
      "kgVar": "1.58",
      "ust25": "1.77"
    },
    "details": {
      "note": "Inter Turku ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "72994bd8-27dc-4ff1-ba5d-0bf6b95d0486",
    "date": "15.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "USL1",
    "country": "USL1",
    "homeTeam": "Fort Wayne",
    "awayTeam": "Chattanooga Red",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.77",
      "msX": "3.08",
      "ms2": "2.98",
      "turnaroundOdd": "37.77",
      "kgVar": "1.38",
      "ust25": "1.45"
    },
    "details": {
      "note": "Chattanooga Red ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fafc24f6-6db8-4eb0-9598-c65679f6859a",
    "date": "15.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "ABD",
    "country": "ABD",
    "homeTeam": "Atlanta Utd",
    "awayTeam": "New York",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.82",
      "msX": "3.55",
      "ms2": "2.79",
      "turnaroundOdd": "24.43",
      "kgVar": "1.24",
      "ust25": "1.25"
    },
    "details": {
      "note": "Atlanta Utd ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "3b730d0a-e79b-44b9-afcd-8198442a7de5",
    "date": "15.08.2026",
    "time": "00:30",
    "month": "Ağustos 2026",
    "league": "ELSAL",
    "country": "ELSAL",
    "homeTeam": "Aguila",
    "awayTeam": "Balboa",
    "iyScore": "2 - 1",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.36",
      "msX": "3.45",
      "ms2": "5.03",
      "turnaroundOdd": "61.35",
      "kgVar": "1.71",
      "ust25": "1.63"
    },
    "details": {
      "note": "Balboa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8bc8356a-70c4-4468-94dc-3f62b33de6d1",
    "date": "15.08.2026",
    "time": "00:00",
    "month": "Ağustos 2026",
    "league": "ARJPBN",
    "country": "ARJPBN",
    "homeTeam": "Godoy Cruz",
    "awayTeam": "Maipu",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.52",
      "msX": "2.86",
      "ms2": "4.55",
      "turnaroundOdd": "55.82",
      "kgVar": "2.04",
      "ust25": "2.19"
    },
    "details": {
      "note": "Maipu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "7ffc5188-883a-4e60-aa4f-a806aa1e0a6f",
    "date": "15.08.2026",
    "time": "00:00",
    "month": "Ağustos 2026",
    "league": "KAPL",
    "country": "KAPL",
    "homeTeam": "Cavalry",
    "awayTeam": "Forge",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.14",
      "msX": "2.69",
      "ms2": "2.60",
      "turnaroundOdd": "28.11",
      "kgVar": "1.61",
      "ust25": "1.86"
    },
    "details": {
      "note": "Cavalry ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "47b130c2-688d-4af7-82b4-b2942822a788",
    "date": "15.08.2026",
    "time": "22:30",
    "month": "Ağustos 2026",
    "league": "İS1",
    "country": "İS1",
    "homeTeam": "Sevilla",
    "awayTeam": "Vallecano",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.33",
      "msX": "2.55",
      "ms2": "2.71",
      "turnaroundOdd": "30.30",
      "kgVar": "1.86",
      "ust25": "2.28"
    },
    "details": {
      "note": "Sevilla ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e420b343-497d-4156-bda2-acaa6ebb6790",
    "date": "15.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "POR3",
    "country": "POR3",
    "homeTeam": "Louletano",
    "awayTeam": "Cf Os Belenense",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.83",
      "msX": "2.73",
      "ms2": "1.98",
      "turnaroundOdd": "26.27",
      "kgVar": "1.68",
      "ust25": "1.92"
    },
    "details": {
      "note": "Cf Os Belenense ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "df35e71a-b8dc-4196-b809-2b0db6d7ceb8",
    "date": "15.08.2026",
    "time": "19:45",
    "month": "Ağustos 2026",
    "league": "BAE",
    "country": "BAE",
    "homeTeam": "Khorfakkan Clu",
    "awayTeam": "Al Ahli Dubai",
    "iyScore": "1 - 0",
    "msScore": "1 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "5.22",
      "msX": "4.19",
      "ms2": "1.25",
      "turnaroundOdd": "17.88",
      "kgVar": "1.45",
      "ust25": "1.30"
    },
    "details": {
      "note": "Al Ahli Dubai ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "612feb3f-c108-45ea-b762-b2fcb80e2b57",
    "date": "15.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "SLVN2",
    "country": "SLVN2",
    "homeTeam": "Brezice",
    "awayTeam": "Dren Vrhnika",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.20",
      "msX": "2.92",
      "ms2": "2.34",
      "turnaroundOdd": "30.41",
      "kgVar": "1.46",
      "ust25": "1.60"
    },
    "details": {
      "note": "Dren Vrhnika ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fa9d6cc3-a965-43cf-907b-750a6f135f4d",
    "date": "15.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İTK",
    "country": "İTK",
    "homeTeam": "Unione V.",
    "awayTeam": "Modena",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.36",
      "msX": "3.86",
      "ms2": "5.16",
      "turnaroundOdd": "19.14",
      "kgVar": "1.67",
      "ust25": "1.56"
    },
    "details": {
      "note": "Unione V. ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d04a5fae-50bd-4260-8af4-1b5fb60b68ee",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Rade",
    "awayTeam": "Drobak/Frogn",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.21",
      "msX": "4.59",
      "ms2": "5.44",
      "turnaroundOdd": "17.41",
      "kgVar": "1.19"
    },
    "details": {
      "note": "Rade ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "cc290503-9e0e-40d2-97df-06bac3a63f07",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "DAN3",
    "country": "DAN3",
    "homeTeam": "Asa Aarhus",
    "awayTeam": "Vanlose",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.81",
      "msX": "3.02",
      "ms2": "1.85",
      "turnaroundOdd": "35.81",
      "kgVar": "1.41",
      "ust25": "1.51"
    },
    "details": {
      "note": "Asa Aarhus ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "75904a9a-aebe-4b62-9643-7494bccbcfb4",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "HOLTW",
    "country": "HOLTW",
    "homeTeam": "Jong Sparta",
    "awayTeam": "Rohda Raalte",
    "iyScore": "0 - 1",
    "msScore": "6 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.63",
      "msX": "3.49",
      "ms2": "3.05",
      "turnaroundOdd": "22.24",
      "kgVar": "1.29"
    },
    "details": {
      "note": "Jong Sparta ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ac7f6874-653f-46f2-9041-29d814c20879",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "HOLTW",
    "country": "HOLTW",
    "homeTeam": "Kozakken Boys",
    "awayTeam": "Ijsselmeervogel",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.92",
      "msX": "3.15",
      "ms2": "2.59",
      "turnaroundOdd": "33.28",
      "kgVar": "1.31",
      "ust25": "1.37"
    },
    "details": {
      "note": "Ijsselmeervogel ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8a54ca7f-f387-4cab-879b-b172b018c119",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İN2",
    "country": "İN2",
    "homeTeam": "York",
    "awayTeam": "Bristol Rovers",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.96",
      "msX": "2.85",
      "ms2": "2.74",
      "turnaroundOdd": "26.04",
      "kgVar": "1.60",
      "ust25": "1.80"
    },
    "details": {
      "note": "York ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "06d21e1a-7e73-474a-b6ae-dc3c2130f889",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "LET1",
    "country": "LET1",
    "homeTeam": "Marupe",
    "awayTeam": "Super Nova Ii",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.95",
      "msX": "3.19",
      "ms2": "2.51",
      "turnaroundOdd": "25.93",
      "kgVar": "1.31",
      "ust25": "1.36"
    },
    "details": {
      "note": "Marupe ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "ad273d1b-cd5e-44c2-89bc-0d3f715fdc16",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNCL",
    "country": "İNCL",
    "homeTeam": "Middlesbrough",
    "awayTeam": "Lincoln",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.31",
      "msX": "3.97",
      "ms2": "5.53",
      "turnaroundOdd": "18.57",
      "kgVar": "1.70",
      "ust25": "1.55"
    },
    "details": {
      "note": "Middlesbrough ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "912d52b4-23b4-496a-a085-8c09efb5a370",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İCON",
    "country": "İCON",
    "homeTeam": "Gateshead(Sout",
    "awayTeam": "Chorley",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.30",
      "msX": "3.92",
      "ms2": "5.05",
      "turnaroundOdd": "18.45",
      "kgVar": "1.52",
      "ust25": "1.40"
    },
    "details": {
      "note": "Gateshead(Sout ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "040ad932-71b9-4d0b-921b-8478b0ab6b54",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İBSL",
    "country": "İBSL",
    "homeTeam": "Worthing",
    "awayTeam": "Forest Green",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.86",
      "msX": "3.14",
      "ms2": "1.79",
      "turnaroundOdd": "24.09",
      "kgVar": "1.35",
      "ust25": "1.40"
    },
    "details": {
      "note": "Forest Green ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f7dfd8fa-5da5-4c8c-afe1-2d439d682054",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "RUS1",
    "country": "RUS1",
    "homeTeam": "Tekstilshchik",
    "awayTeam": "Olimpiyets",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "5.04",
      "msX": "3.55",
      "ms2": "1.34",
      "turnaroundOdd": "18.91",
      "kgVar": "1.72",
      "ust25": "1.63"
    },
    "details": {
      "note": "Olimpiyets ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5874beb3-7a81-489f-8d9a-47fd1b74bf32",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "BEL2",
    "country": "BEL2",
    "homeTeam": "Patro Eisden",
    "awayTeam": "Rsc Anderlecht",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.46",
      "msX": "3.37",
      "ms2": "4.06",
      "turnaroundOdd": "20.29",
      "kgVar": "1.48",
      "ust25": "1.46"
    },
    "details": {
      "note": "Patro Eisden ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "694b574d-3f6c-4e43-9629-0c95f52613a5",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNGNLP",
    "country": "İNGNLP",
    "homeTeam": "Leighton Town",
    "awayTeam": "Worcester City",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.08",
      "msX": "3.04",
      "ms2": "2.41",
      "turnaroundOdd": "27.42",
      "kgVar": "1.38",
      "ust25": "1.49"
    },
    "details": {
      "note": "Leighton Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "83621ad4-944d-4053-84eb-2d9636d46941",
    "date": "15.08.2026",
    "time": "17:30",
    "month": "Ağustos 2026",
    "league": "AL3",
    "country": "AL3",
    "homeTeam": "Verl 1924",
    "awayTeam": "Duisburg",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.72",
      "msX": "3.20",
      "ms2": "1.95",
      "turnaroundOdd": "25.93",
      "kgVar": "1.38",
      "ust25": "1.45"
    },
    "details": {
      "note": "Duisburg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5b4b678e-07a6-498a-83df-6c22fdb5e501",
    "date": "15.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "BLR",
    "country": "BLR",
    "homeTeam": "Neman Grodno",
    "awayTeam": "Minsk",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.89",
      "msX": "2.78",
      "ms2": "2.98",
      "turnaroundOdd": "25.23",
      "kgVar": "1.63",
      "ust25": "1.84"
    },
    "details": {
      "note": "Neman Grodno ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "04d6a876-1bc4-4355-b6a6-67fbd564580e",
    "date": "15.08.2026",
    "time": "18:18",
    "month": "Ağustos 2026",
    "league": "KAZP",
    "country": "KAZP",
    "homeTeam": "Kaisar",
    "awayTeam": "Aktobe",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.60",
      "msX": "2.77",
      "ms2": "2.08",
      "turnaroundOdd": "27.42",
      "kgVar": "1.63",
      "ust25": "1.85"
    },
    "details": {
      "note": "Aktobe ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "25f43f29-dbfb-4ee5-abdf-91b852e99aab",
    "date": "15.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "İSV1Y",
    "country": "İSV1Y",
    "homeTeam": "Lugano Ii",
    "awayTeam": "Luzern Ii",
    "iyScore": "2 - 3",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.62",
      "msX": "3.39",
      "ms2": "1.82",
      "turnaroundOdd": "33.63",
      "kgVar": "1.15"
    },
    "details": {
      "note": "Lugano Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c54708b6-d453-448d-bcbe-9bf28d559918",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "İSÇ",
    "country": "İSÇ",
    "homeTeam": "Mjallby",
    "awayTeam": "Sirius",
    "iyScore": "0 - 3",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.77",
      "msX": "3.18",
      "ms2": "1.94",
      "turnaroundOdd": "35.36",
      "kgVar": "1.39",
      "ust25": "1.48"
    },
    "details": {
      "note": "Mjallby ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "2a8dc8d6-deb8-4032-954a-29ae9494c0f6",
    "date": "15.08.2026",
    "time": "15:45",
    "month": "Ağustos 2026",
    "league": "POL",
    "country": "POL",
    "homeTeam": "Zaglebie Lubin",
    "awayTeam": "Slask Wroclaw",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.92",
      "msX": "2.84",
      "ms2": "2.84",
      "turnaroundOdd": "25.58",
      "kgVar": "1.47",
      "ust25": "1.61"
    },
    "details": {
      "note": "Zaglebie Lubin ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c2c11598-0337-45d9-8a6a-d87fc993035d",
    "date": "15.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "İSÇD4",
    "country": "İSÇD4",
    "homeTeam": "Skelleftea",
    "awayTeam": "Ifk Lulea",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.41",
      "msX": "3.56",
      "ms2": "4.25",
      "turnaroundOdd": "19.71",
      "kgVar": "1.41",
      "ust25": "1.36"
    },
    "details": {
      "note": "Skelleftea ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "a7997d19-7ee7-4bc5-af86-e7caa2c67e39",
    "date": "15.08.2026",
    "time": "19:45",
    "month": "Ağustos 2026",
    "league": "BAE : Körfez Ligi",
    "country": "BAE",
    "homeTeam": "Khor Fakkan",
    "awayTeam": "Shabab Al Ahli",
    "iyScore": "1 - 0",
    "msScore": "1 - 5",
    "type": "1/2",
    "odds": {
      "ms1": "5.22",
      "msX": "4.19",
      "ms2": "1.25",
      "turnaroundOdd": "17.88",
      "kgVar": "1.45",
      "ust25": "1.30"
    },
    "details": {
      "note": "Shabab Al Ahli ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b0c946db-98ff-46c9-adb2-c2407f9e44b2",
    "date": "15.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İtalya : Kupa",
    "country": "İtalya",
    "homeTeam": "Venezia",
    "awayTeam": "Modena",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.38",
      "msX": "3.80",
      "ms2": "4.97",
      "turnaroundOdd": "19.37",
      "kgVar": "1.64",
      "ust25": "1.56"
    },
    "details": {
      "note": "Venezia ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d98ac790-6f7e-47aa-b49b-4a5fbfe601fc",
    "date": "15.08.2026",
    "time": "22:30",
    "month": "Ağustos 2026",
    "league": "İspanya : LaLiga",
    "country": "İspanya",
    "homeTeam": "Sevilla",
    "awayTeam": "Rayo Vallecano",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.21",
      "msX": "2.58",
      "ms2": "2.84",
      "turnaroundOdd": "28.91",
      "kgVar": "1.88",
      "ust25": "2.31"
    },
    "details": {
      "note": "Sevilla ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "1d561256-bcbf-4f23-9c9f-862efab6f294",
    "date": "15.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Ullern",
    "awayTeam": "Fk Union Carl B",
    "iyScore": "0 - 1",
    "msScore": "4 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.98",
      "msX": "3.69",
      "ms2": "1.62",
      "turnaroundOdd": "37.77",
      "kgVar": "1.14"
    },
    "details": {
      "note": "Ullern ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "2e88d822-bb07-4769-a0b8-6046f9521958",
    "date": "15.08.2026",
    "time": "10:00",
    "month": "Ağustos 2026",
    "league": "AVNPL",
    "country": "AVNPL",
    "homeTeam": "Sydney Olympic",
    "awayTeam": "Sydney United",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.63",
      "msX": "3.04",
      "ms2": "1.61",
      "turnaroundOdd": "22.02",
      "kgVar": "1.54",
      "ust25": "1.62"
    },
    "details": {
      "note": "Sydney United ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "023daa70-a3c7-4857-a1a8-d3fd7b0d5de7",
    "date": "15.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "JAP3",
    "country": "JAP3",
    "homeTeam": "Zweigen Kanaza",
    "awayTeam": "Fukushima Unite",
    "iyScore": "0 - 2",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "1.63",
      "msX": "3.14",
      "ms2": "3.37",
      "turnaroundOdd": "22.24",
      "kgVar": "1.49",
      "ust25": "1.55"
    },
    "details": {
      "note": "Zweigen Kanaza ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "6800e547-3405-428a-bb04-aa7ba32a208e",
    "date": "15.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "POL2",
    "country": "POL2",
    "homeTeam": "Slask Wroclaw",
    "awayTeam": "Chojniczanka",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.49",
      "msX": "3.09",
      "ms2": "2.00",
      "turnaroundOdd": "26.50",
      "kgVar": "1.34",
      "ust25": "1.41"
    },
    "details": {
      "note": "Chojniczanka ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f6f5dd15-ad50-4bc2-947f-753e7eb7c7b3",
    "date": "15.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Jonsereds If",
    "awayTeam": "Onsala",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.41",
      "msX": "3.20",
      "ms2": "2.01",
      "turnaroundOdd": "31.22",
      "kgVar": "1.27"
    },
    "details": {
      "note": "Jonsereds If ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "189ba734-f9f0-4fef-8d91-7b166bd9bbc2",
    "date": "15.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "İSÇD4",
    "country": "İSÇD4",
    "homeTeam": "Bodens",
    "awayTeam": "Gottne",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.17",
      "msX": "3.36",
      "ms2": "2.14",
      "turnaroundOdd": "28.45"
    },
    "details": {
      "note": "Bodens ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "51fa6f0b-4457-485a-8ac1-b286e3689cf3",
    "date": "15.08.2026",
    "time": "14:30",
    "month": "Ağustos 2026",
    "league": "İN1",
    "country": "İN1",
    "homeTeam": "Reading",
    "awayTeam": "Luton",
    "iyScore": "3 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.60",
      "msX": "2.97",
      "ms2": "1.99",
      "turnaroundOdd": "26.39",
      "kgVar": "1.46",
      "ust25": "1.59"
    },
    "details": {
      "note": "Luton ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "c0a0995f-4e89-4d2a-b762-00eeb3ea0c29",
    "date": "15.08.2026",
    "time": "04:00",
    "month": "Ağustos 2026",
    "league": "USL1",
    "country": "USL1",
    "homeTeam": "Spokane Veloci",
    "awayTeam": "Corpus Christi",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.56",
      "msX": "3.05",
      "ms2": "3.88",
      "turnaroundOdd": "48.12",
      "kgVar": "1.60",
      "ust25": "1.67"
    },
    "details": {
      "note": "Corpus Christi ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e4beb6f3-7265-4186-9153-7b3a63b25150",
    "date": "15.08.2026",
    "time": "05:30",
    "month": "Ağustos 2026",
    "league": "USLP",
    "country": "USLP",
    "homeTeam": "Las Vegas Ligh",
    "awayTeam": "Brooklyn",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.63",
      "msX": "3.25",
      "ms2": "3.28",
      "turnaroundOdd": "22.24",
      "kgVar": "1.38",
      "ust25": "1.40"
    },
    "details": {
      "note": "Las Vegas Ligh ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "afefc743-93f0-4cd0-9150-961c425ceb66",
    "date": "15.08.2026",
    "time": "14:35",
    "month": "Ağustos 2026",
    "league": "ÇİNSL",
    "country": "ÇİNSL",
    "homeTeam": "Zhejiang G. Fc",
    "awayTeam": "Chengdu Ron.",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.58",
      "msX": "3.30",
      "ms2": "1.87",
      "turnaroundOdd": "25.01",
      "kgVar": "1.23",
      "ust25": "1.25"
    },
    "details": {
      "note": "Chengdu Ron. ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "0c39060a-4fc2-4619-a2a0-d93789673ae5",
    "date": "15.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "İSÇ4",
    "country": "İSÇ4",
    "homeTeam": "Torns",
    "awayTeam": "Ifk Berga",
    "iyScore": "2 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "3.60",
      "msX": "3.45",
      "ms2": "1.52",
      "turnaroundOdd": "20.98",
      "kgVar": "1.36"
    },
    "details": {
      "note": "Ifk Berga ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e33407d1-e60e-4ff1-91e9-8b299efa356e",
    "date": "15.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "ÇİNSL",
    "country": "ÇİNSL",
    "homeTeam": "Yunnan Yukun",
    "awayTeam": "Dalian Zhixing",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.83",
      "msX": "3.43",
      "ms2": "2.58",
      "turnaroundOdd": "24.55",
      "kgVar": "1.18",
      "ust25": "1.18"
    },
    "details": {
      "note": "Yunnan Yukun ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "2c27e006-d14d-44d6-986c-839194a1ac9f",
    "date": "15.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Ulfstind",
    "awayTeam": "Skjetten",
    "iyScore": "0 - 2",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "3.74",
      "msX": "4.27",
      "ms2": "1.38",
      "turnaroundOdd": "46.51",
      "kgVar": "1.12"
    },
    "details": {
      "note": "Ulfstind ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "b6e744dc-be11-4404-b81a-66f1da99a307",
    "date": "15.08.2026",
    "time": "19:15",
    "month": "Ağustos 2026",
    "league": "Portekiz : 3. Lig",
    "country": "Portekiz",
    "homeTeam": "Louletano",
    "awayTeam": "Belenenses",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.83",
      "msX": "2.73",
      "ms2": "1.98",
      "turnaroundOdd": "26.27",
      "kgVar": "1.68",
      "ust25": "1.92"
    },
    "details": {
      "note": "Belenenses ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "37613d7e-aa1d-450c-b81f-75bff522d653",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "Belçika : Challenger Pro Lig",
    "country": "Belçika",
    "homeTeam": "Patro",
    "awayTeam": "Anderlecht U23",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.46",
      "msX": "3.37",
      "ms2": "4.06",
      "turnaroundOdd": "20.29",
      "kgVar": "1.48",
      "ust25": "1.46"
    },
    "details": {
      "note": "Patro ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "eb8d1d53-b8ad-4637-9440-81224d9c2685",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "HAZ",
    "country": "HAZ",
    "homeTeam": "Sunderland",
    "awayTeam": "Rennes",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.98",
      "msX": "3.20",
      "ms2": "2.67",
      "turnaroundOdd": "26.27",
      "kgVar": "1.43",
      "ust25": "1.51"
    },
    "details": {
      "note": "Sunderland ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "4402c775-1ba2-42d2-bb4e-aa651d4c466f",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İngiltere : 2. Lig",
    "country": "İngiltere",
    "homeTeam": "York City",
    "awayTeam": "Bristol Rovers",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.96",
      "msX": "2.85",
      "ms2": "2.74",
      "turnaroundOdd": "26.04",
      "kgVar": "1.60",
      "ust25": "1.80"
    },
    "details": {
      "note": "York City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "3d3303ca-3437-43d8-a0d6-2eeabca3e8dc",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "Rusya : FNL",
    "country": "Rusya",
    "homeTeam": "T. Telec Ivan",
    "awayTeam": "Nizhny Nov.",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "5.04",
      "msX": "3.55",
      "ms2": "1.34",
      "turnaroundOdd": "18.91",
      "kgVar": "1.75",
      "ust25": "1.66"
    },
    "details": {
      "note": "Nizhny Nov. ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e1e73d28-1646-46ae-9d1d-f6ee9616e665",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İngiltere : Ulusal Lig N/S",
    "country": "İngiltere",
    "homeTeam": "South Shields",
    "awayTeam": "Chorley",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.30",
      "msX": "3.92",
      "ms2": "5.05",
      "turnaroundOdd": "18.45",
      "kgVar": "1.52",
      "ust25": "1.40"
    },
    "details": {
      "note": "South Shields ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "419547a8-d4a7-4f0e-a904-10a1cc81136e",
    "date": "15.08.2026",
    "time": "17:30",
    "month": "Ağustos 2026",
    "league": "Almanya : 3. Lig",
    "country": "Almanya",
    "homeTeam": "SC Verl",
    "awayTeam": "Duisburg",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.80",
      "msX": "3.17",
      "ms2": "1.93",
      "turnaroundOdd": "25.70",
      "kgVar": "1.38",
      "ust25": "1.45"
    },
    "details": {
      "note": "Duisburg ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "486e4bc8-f2d7-4d05-938a-6aadd5dc83ea",
    "date": "15.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "Beyaz Rusya : Premier Lig",
    "country": "Beyaz Rusya",
    "homeTeam": "Neman Grodno",
    "awayTeam": "FC Minsk",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.75",
      "msX": "2.81",
      "ms2": "3.36",
      "turnaroundOdd": "23.63",
      "kgVar": "1.66",
      "ust25": "1.84"
    },
    "details": {
      "note": "Neman Grodno ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "21c9f412-8406-445e-919c-362aba42e8be",
    "date": "15.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "Kazakistan : Premier Lig",
    "country": "Kazakistan",
    "homeTeam": "K. Kyzylorda",
    "awayTeam": "Aktobe",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.60",
      "msX": "2.77",
      "ms2": "2.08",
      "turnaroundOdd": "27.42",
      "kgVar": "1.63",
      "ust25": "1.85"
    },
    "details": {
      "note": "Aktobe ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6a57a29c-bae1-4cf0-96e7-4e4d94fe4522",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İngiltere : Championship",
    "country": "İngiltere",
    "homeTeam": "Middlesbrough",
    "awayTeam": "Lincoln City",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.31",
      "msX": "3.97",
      "ms2": "5.53",
      "turnaroundOdd": "18.57",
      "kgVar": "1.71",
      "ust25": "1.57"
    },
    "details": {
      "note": "Middlesbrough ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "8c0244b8-a505-46e9-a975-a9d86592ee8a",
    "date": "15.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "İNCL",
    "country": "İNCL",
    "homeTeam": "Charlton",
    "awayTeam": "Derby County",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.40",
      "msX": "2.83",
      "ms2": "2.38",
      "turnaroundOdd": "31.10",
      "kgVar": "1.72",
      "ust25": "2.00"
    },
    "details": {
      "note": "Charlton ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "93c15fb7-5d6e-4370-9877-55daed50ff09",
    "date": "15.08.2026",
    "time": "14:30",
    "month": "Ağustos 2026",
    "league": "İngiltere : 1. Lig",
    "country": "İngiltere",
    "homeTeam": "Reading",
    "awayTeam": "Luton Town",
    "iyScore": "3 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "2.60",
      "msX": "2.97",
      "ms2": "1.99",
      "turnaroundOdd": "26.39",
      "kgVar": "1.46",
      "ust25": "1.59"
    },
    "details": {
      "note": "Luton Town ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "dfc96a6e-cf0a-4ec4-8b64-36d19fedc265",
    "date": "15.08.2026",
    "time": "04:00",
    "month": "Ağustos 2026",
    "league": "Meksika : Ascenso MX",
    "country": "Meksika",
    "homeTeam": "Correcaminos",
    "awayTeam": "Tapatio",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.65",
      "msX": "3.26",
      "ms2": "3.19",
      "turnaroundOdd": "40.19",
      "kgVar": "1.36",
      "ust25": "1.39"
    },
    "details": {
      "note": "Tapatio ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "95b7ad03-a0ea-447f-ae2c-9e16c77b2593",
    "date": "15.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "Polonya : 2. Lig",
    "country": "Polonya",
    "homeTeam": "Slask II",
    "awayTeam": "Chojniczanka",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.49",
      "msX": "3.09",
      "ms2": "2.00",
      "turnaroundOdd": "26.50",
      "kgVar": "1.34",
      "ust25": "1.41"
    },
    "details": {
      "note": "Chojniczanka ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "ead8f1f3-22b4-4489-a35b-f0bef3dfa299",
    "date": "15.08.2026",
    "time": "13:30",
    "month": "Ağustos 2026",
    "league": "Güney Kore : K-Lig",
    "country": "Güney Kore",
    "homeTeam": "FC Seoul",
    "awayTeam": "Daejeon Citi.",
    "iyScore": "0 - 1",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.11",
      "msX": "2.98",
      "ms2": "2.62",
      "turnaroundOdd": "27.76",
      "kgVar": "1.51",
      "ust25": "1.67"
    },
    "details": {
      "note": "FC Seoul ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c0a3e0be-6027-447c-8cc7-a02f990a3a49",
    "date": "15.08.2026",
    "time": "13:30",
    "month": "Ağustos 2026",
    "league": "Japonya : J3 Lig",
    "country": "Japonya",
    "homeTeam": "Z. Kanazawa",
    "awayTeam": "Fukushima Utd",
    "iyScore": "0 - 2",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "1.63",
      "msX": "3.14",
      "ms2": "3.37",
      "turnaroundOdd": "22.24",
      "kgVar": "1.49",
      "ust25": "1.55"
    },
    "details": {
      "note": "Z. Kanazawa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "e259c1c3-82ca-4ab6-90fd-014862092bba",
    "date": "15.08.2026",
    "time": "13:30",
    "month": "Ağustos 2026",
    "league": "GKOR",
    "country": "GKOR",
    "homeTeam": "Fc Seoul",
    "awayTeam": "Daejeon Citizen",
    "iyScore": "0 - 1",
    "msScore": "4 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "2.06",
      "msX": "2.99",
      "ms2": "2.70",
      "turnaroundOdd": "27.19",
      "kgVar": "1.51",
      "ust25": "1.67"
    },
    "details": {
      "note": "Fc Seoul ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "1720e66d-9654-42c4-b030-39f8cc6cf2af",
    "date": "15.08.2026",
    "time": "14:35",
    "month": "Ağustos 2026",
    "league": "Çin : Süper Lig",
    "country": "Çin",
    "homeTeam": "Zhejiang G.",
    "awayTeam": "Chengdu",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.49",
      "msX": "3.30",
      "ms2": "1.92",
      "turnaroundOdd": "25.58",
      "kgVar": "1.23",
      "ust25": "1.25"
    },
    "details": {
      "note": "Chengdu ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "2d1757e3-6dde-4e82-9962-240206e03310",
    "date": "15.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "Çin : Süper Lig",
    "country": "Çin",
    "homeTeam": "Yukun",
    "awayTeam": "Yingbo",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.87",
      "msX": "3.44",
      "ms2": "2.51",
      "turnaroundOdd": "25.01",
      "kgVar": "1.18",
      "ust25": "1.18"
    },
    "details": {
      "note": "Yukun ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "d0de3f9b-6aa9-47d1-8628-ddb901c20fd0",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "İsveç : Allsvenskan",
    "country": "İsveç",
    "homeTeam": "Mjallby",
    "awayTeam": "IK Sirius",
    "iyScore": "0 - 3",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.69",
      "msX": "3.17",
      "ms2": "1.98",
      "turnaroundOdd": "34.44",
      "kgVar": "1.39",
      "ust25": "1.48"
    },
    "details": {
      "note": "Mjallby ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "bfcb5881-35e5-42fa-8b97-5afc10c843b6",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "Hollanda : 2. Lig",
    "country": "Hollanda",
    "homeTeam": "Jong Sparta U21",
    "awayTeam": "ROHDA",
    "iyScore": "0 - 1",
    "msScore": "6 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.62",
      "msX": "3.47",
      "ms2": "3.15",
      "turnaroundOdd": "22.13",
      "kgVar": "1.29"
    },
    "details": {
      "note": "Jong Sparta U21 ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "be5d42d1-537a-49ae-9c58-266f62715fef",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "Hollanda : 2. Lig",
    "country": "Hollanda",
    "homeTeam": "Kozakken Boys",
    "awayTeam": "IJsselmeervoge",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.92",
      "msX": "3.15",
      "ms2": "2.59",
      "turnaroundOdd": "33.28",
      "kgVar": "1.31",
      "ust25": "1.37"
    },
    "details": {
      "note": "IJsselmeervoge ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "ca548794-aa02-413a-bc14-1a78d9975bf9",
    "date": "15.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "NOR4",
    "country": "NOR4",
    "homeTeam": "Brumunddal",
    "awayTeam": "Raelingen",
    "iyScore": "1 - 0",
    "msScore": "2 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "7.10",
      "msX": "6.11",
      "ms2": "1.09",
      "turnaroundOdd": "16.04",
      "kgVar": "1.13"
    },
    "details": {
      "note": "Raelingen ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "26714c02-620f-4789-b834-f82dc8a69a12",
    "date": "14.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "Çekya : FNL",
    "country": "Çekya",
    "homeTeam": "Dukla Prag",
    "awayTeam": "Slavia Prag II",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.48",
      "msX": "3.40",
      "ms2": "3.92",
      "turnaroundOdd": "48.58",
      "kgVar": "1.45",
      "ust25": "1.44"
    },
    "details": {
      "note": "Slavia Prag II ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "82294dbe-8451-4979-bf13-c07a6cfab38f",
    "date": "14.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "Fransa : Ligue 3",
    "country": "Fransa",
    "homeTeam": "Thionville",
    "awayTeam": "Caen",
    "iyScore": "1 - 2",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "1.90",
      "msX": "2.91",
      "ms2": "2.80",
      "turnaroundOdd": "25.35",
      "kgVar": "1.53",
      "ust25": "1.69"
    },
    "details": {
      "note": "Thionville ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fa9c9e3d-8b9e-44bd-b1a7-647ecefb27d3",
    "date": "14.08.2026",
    "time": "04:00",
    "month": "Ağustos 2026",
    "league": "MEK2",
    "country": "MEK2",
    "homeTeam": "Correcaminos U",
    "awayTeam": "Cd Tapatio",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.65",
      "msX": "3.26",
      "ms2": "3.19",
      "turnaroundOdd": "40.19",
      "kgVar": "1.36",
      "ust25": "1.39"
    },
    "details": {
      "note": "Cd Tapatio ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "38b3c6f8-7e58-463a-aec3-f6be0f9824ac",
    "date": "14.08.2026",
    "time": "12:30",
    "month": "Ağustos 2026",
    "league": "AVNPL",
    "country": "AVNPL",
    "homeTeam": "Brisbane Olymp",
    "awayTeam": "Rochedale Rover",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.25",
      "msX": "3.22",
      "ms2": "2.13",
      "turnaroundOdd": "27.99",
      "kgVar": "1.19"
    },
    "details": {
      "note": "Rochedale Rover ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e9c8c64f-f8c6-459a-9cc8-3528cbdf4788",
    "date": "14.08.2026",
    "time": "14:35",
    "month": "Ağustos 2026",
    "league": "ÇİNSL",
    "country": "ÇİNSL",
    "homeTeam": "Wuhan Three To",
    "awayTeam": "Shanghai Port",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.31",
      "msX": "3.18",
      "ms2": "2.08",
      "turnaroundOdd": "27.42",
      "kgVar": "1.29",
      "ust25": "1.35"
    },
    "details": {
      "note": "Shanghai Port ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "269c7eb7-a7b0-4555-9bd9-7f349cb3a39b",
    "date": "14.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "BLR",
    "country": "BLR",
    "homeTeam": "Arsenal",
    "awayTeam": "Slavia Mozyr",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "4.11",
      "msX": "3.02",
      "ms2": "1.54",
      "turnaroundOdd": "21.21",
      "kgVar": "1.70",
      "ust25": "1.77"
    },
    "details": {
      "note": "Slavia Mozyr ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a7c71e65-3685-4e53-a945-387174f55356",
    "date": "14.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "MAC",
    "country": "MAC",
    "homeTeam": "Budapest Honve",
    "awayTeam": "Vasas",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.30",
      "msX": "2.94",
      "ms2": "2.22",
      "turnaroundOdd": "29.03",
      "kgVar": "1.34",
      "ust25": "1.44"
    },
    "details": {
      "note": "Vasas ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "16bcb2da-615a-412b-af53-e91c562ea57d",
    "date": "14.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "UGS8",
    "country": "UGS8",
    "homeTeam": "Sc Villa",
    "awayTeam": "Nec",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.41",
      "msX": "2.47",
      "ms2": "2.47",
      "turnaroundOdd": "31.91"
    },
    "details": {
      "note": "Nec ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "e3eb7353-0589-4708-98ef-5ad19889025d",
    "date": "14.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "ÇEK2",
    "country": "ÇEK2",
    "homeTeam": "Dukla Prag",
    "awayTeam": "Slavia Praha Ii",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.48",
      "msX": "3.40",
      "ms2": "3.92",
      "turnaroundOdd": "48.58",
      "kgVar": "1.45",
      "ust25": "1.44"
    },
    "details": {
      "note": "Slavia Praha Ii ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "ee726114-aff1-4ea4-aa3f-0d60e95f7c63",
    "date": "14.08.2026",
    "time": "20:00",
    "month": "Ağustos 2026",
    "league": "FR3",
    "country": "FR3",
    "homeTeam": "Thionville Lus",
    "awayTeam": "Caen",
    "iyScore": "1 - 2",
    "msScore": "4 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "1.90",
      "msX": "2.91",
      "ms2": "2.80",
      "turnaroundOdd": "25.35",
      "kgVar": "1.53",
      "ust25": "1.69"
    },
    "details": {
      "note": "Thionville Lus ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "cdf9464b-664d-46cb-8c40-2fb9b3e56ede",
    "date": "14.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "New York City",
    "awayTeam": "Necaxa",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.44",
      "msX": "3.54",
      "ms2": "4.02",
      "turnaroundOdd": "49.73",
      "kgVar": "1.35",
      "ust25": "1.31"
    },
    "details": {
      "note": "Necaxa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "ebc87fe4-28c9-44fe-aa2c-2ab9f708580a",
    "date": "14.08.2026",
    "time": "14:35",
    "month": "Ağustos 2026",
    "league": "Çin : Süper Lig",
    "country": "Çin",
    "homeTeam": "Wuhan Three",
    "awayTeam": "Shanghai Port",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "2.31",
      "msX": "3.18",
      "ms2": "2.08",
      "turnaroundOdd": "27.42",
      "kgVar": "1.29",
      "ust25": "1.36"
    },
    "details": {
      "note": "Shanghai Port ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "10b8af82-23ee-4c6a-8b86-3c0072338352",
    "date": "14.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "Beyaz Rusya : Premier Lig",
    "country": "Beyaz Rusya",
    "homeTeam": "Arsenal D.",
    "awayTeam": "Slavia Mozyr",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "4.11",
      "msX": "3.02",
      "ms2": "1.54",
      "turnaroundOdd": "21.21",
      "kgVar": "1.70",
      "ust25": "1.77"
    },
    "details": {
      "note": "Slavia Mozyr ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b4e76938-068d-47c0-b480-37ba2b49e265",
    "date": "14.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "Macaristan : NB I",
    "country": "Macaristan",
    "homeTeam": "B. Honved",
    "awayTeam": "Vasas",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.30",
      "msX": "2.94",
      "ms2": "2.22",
      "turnaroundOdd": "29.03",
      "kgVar": "1.34",
      "ust25": "1.44"
    },
    "details": {
      "note": "Vasas ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "16d2029c-dec0-418b-a51e-1c502b80a255",
    "date": "13.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "CONLK",
    "country": "CONLK",
    "homeTeam": "New York City",
    "awayTeam": "Necaxa",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.47",
      "msX": "3.49",
      "ms2": "3.88",
      "turnaroundOdd": "48.12",
      "kgVar": "1.34",
      "ust25": "1.31"
    },
    "details": {
      "note": "Necaxa ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "deb75fad-75b0-4a6c-8e9e-6c26a033148d",
    "date": "13.08.2026",
    "time": "02:30",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "Inter Miami",
    "awayTeam": "Leon",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.59",
      "msX": "3.40",
      "ms2": "3.29",
      "turnaroundOdd": "41.34",
      "kgVar": "1.38",
      "ust25": "1.40"
    },
    "details": {
      "note": "Leon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "8dbc4aab-2f13-4163-816c-e2bd2c6e5bbd",
    "date": "13.08.2026",
    "time": "03:00",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "Monterrey",
    "awayTeam": "Nashville SC",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.72",
      "msX": "3.26",
      "ms2": "2.95",
      "turnaroundOdd": "23.28",
      "kgVar": "1.37",
      "ust25": "1.41"
    },
    "details": {
      "note": "Monterrey ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "7cb05b68-818c-4e91-b7cb-30ba0e3c23ec",
    "date": "13.08.2026",
    "time": "05:30",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "S. Sounders",
    "awayTeam": "CD Guadalajara",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.94",
      "msX": "3.76",
      "ms2": "1.42",
      "turnaroundOdd": "19.83",
      "kgVar": "1.38",
      "ust25": "1.32"
    },
    "details": {
      "note": "CD Guadalajara ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "12f0e76b-fb95-4ec3-acc2-568d95baf86b",
    "date": "13.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "Avrupa : Konferans Ligi",
    "country": "Avrupa",
    "homeTeam": "Tobol",
    "awayTeam": "Partizan",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.58",
      "msX": "3.03",
      "ms2": "1.97",
      "turnaroundOdd": "26.16",
      "kgVar": "1.44",
      "ust25": "1.54"
    },
    "details": {
      "note": "Partizan ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "eefa0568-602b-4fdb-8135-e9becb570889",
    "date": "13.08.2026",
    "time": "21:15",
    "month": "Ağustos 2026",
    "league": "Avrupa : Konferans Ligi",
    "country": "Avrupa",
    "homeTeam": "Sion",
    "awayTeam": "Noah",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.38",
      "msX": "3.65",
      "ms2": "4.33",
      "turnaroundOdd": "19.37",
      "kgVar": "1.46",
      "ust25": "1.39"
    },
    "details": {
      "note": "Sion ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "dc17cffe-7b14-4b4b-b01d-7f5872802056",
    "date": "12.08.2026",
    "time": "01:00",
    "month": "Ağustos 2026",
    "league": "Güney Amerika : Sudamericana",
    "country": "Güney Amerika",
    "homeTeam": "Boca Juniors",
    "awayTeam": "Dep. Recoleta",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.10",
      "msX": "6.91",
      "ms2": "16.50",
      "turnaroundOdd": "27.65",
      "kgVar": "2.40",
      "ust25": "1.42"
    },
    "details": {
      "note": "Boca Juniors ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "8c350647-f127-4054-bc1a-d4d7e8f19ad3",
    "date": "12.08.2026",
    "time": "03:00",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "Cincinnati",
    "awayTeam": "Atlas",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.23",
      "msX": "4.43",
      "ms2": "5.41",
      "turnaroundOdd": "65.72",
      "kgVar": "1.40",
      "ust25": "1.24"
    },
    "details": {
      "note": "Atlas ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "d6dac6b5-3993-46b9-a64a-245fe21e7376",
    "date": "12.08.2026",
    "time": "03:30",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "Minnesota Utd",
    "awayTeam": "Atlante",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.02",
      "msX": "3.05",
      "ms2": "2.47",
      "turnaroundOdd": "26.73",
      "kgVar": "1.39",
      "ust25": "1.49"
    },
    "details": {
      "note": "Minnesota Utd ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "2368c55f-cd6d-4872-85dd-1acfdab47466",
    "date": "12.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "Avrupa : Konferans Ligi",
    "country": "Avrupa",
    "homeTeam": "Katowice",
    "awayTeam": "H. Tel Aviv",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.87",
      "msX": "2.96",
      "ms2": "2.85",
      "turnaroundOdd": "25.01",
      "kgVar": "1.51",
      "ust25": "1.63"
    },
    "details": {
      "note": "Katowice ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "7b048899-f3f4-488a-9cb3-0425ba4b3759",
    "date": "12.08.2026",
    "time": "22:30",
    "month": "Ağustos 2026",
    "league": "Paraguay : Kupa",
    "country": "Paraguay",
    "homeTeam": "Sportivo Iteno",
    "awayTeam": "Club Guarani",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "7.34",
      "msX": "4.31",
      "ms2": "1.17",
      "turnaroundOdd": "87.91",
      "kgVar": "1.82",
      "ust25": "1.50"
    },
    "details": {
      "note": "Sportivo Iteno ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "1cf46f28-faf8-4c09-bced-29c7e61f6442",
    "date": "11.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İskoçya : Challenge Kupası",
    "country": "İskoçya",
    "homeTeam": "B. Rangers",
    "awayTeam": "Hearts II",
    "iyScore": "3 - 1",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.92",
      "msX": "3.51",
      "ms2": "2.38",
      "turnaroundOdd": "30.87",
      "kgVar": "1.16"
    },
    "details": {
      "note": "Hearts II ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "c4cf5806-b17d-4453-8904-c4f6a9381560",
    "date": "11.08.2026",
    "time": "21:45",
    "month": "Ağustos 2026",
    "league": "İskoçya : Challenge Kupası",
    "country": "İskoçya",
    "homeTeam": "East Kilbride",
    "awayTeam": "Kilmarnock II",
    "iyScore": "1 - 2",
    "msScore": "5 - 3",
    "type": "2/1",
    "odds": {
      "ms1": "2.10",
      "msX": "6.30",
      "ms2": "11.15",
      "turnaroundOdd": "27.65",
      "kgVar": "1.57"
    },
    "details": {
      "note": "East Kilbride ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "8e670c55-baaa-4d7e-b5f6-b8e3748852d1",
    "date": "11.08.2026",
    "time": "03:15",
    "month": "Ağustos 2026",
    "league": "Arjantin : Premier Lig",
    "country": "Arjantin",
    "homeTeam": "Union Santa Fe",
    "awayTeam": "C. Cordoba",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.48",
      "msX": "3.15",
      "ms2": "5.03",
      "turnaroundOdd": "61.35",
      "kgVar": "2.06",
      "ust25": "2.11"
    },
    "details": {
      "note": "C. Cordoba ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5f84a9fb-efab-4eb1-851b-a64026d66e44",
    "date": "10.08.2026",
    "time": "00:30",
    "month": "Ağustos 2026",
    "league": "Şili : Premier Lig",
    "country": "Şili",
    "homeTeam": "Dep. Calera",
    "awayTeam": "Colo Colo",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.79",
      "msX": "3.22",
      "ms2": "1.54",
      "turnaroundOdd": "21.21",
      "kgVar": "1.55",
      "ust25": "1.59"
    },
    "details": {
      "note": "Colo Colo ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3920f6ea-f56b-421d-990b-2abebee3be78",
    "date": "10.08.2026",
    "time": "03:00",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "Chicago Fire",
    "awayTeam": "Santos Laguna",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.30",
      "msX": "4.12",
      "ms2": "4.70",
      "turnaroundOdd": "18.45",
      "kgVar": "1.33",
      "ust25": "1.22"
    },
    "details": {
      "note": "Chicago Fire ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "7ea1c158-55e1-4070-ada6-15946dc419b4",
    "date": "10.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "Beyaz Rusya : 1. Lig",
    "country": "Beyaz Rusya",
    "homeTeam": "Gomel II",
    "awayTeam": "Soligorsk",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "3.88",
      "msX": "3.62",
      "ms2": "1.44",
      "turnaroundOdd": "48.12"
    },
    "details": {
      "note": "Gomel II ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "60744fb8-3b44-4f64-b203-ca659565bc38",
    "date": "09.08.2026",
    "time": "20:15",
    "month": "Ağustos 2026",
    "league": "Belçika : Pro Lig",
    "country": "Belçika",
    "homeTeam": "Antwerp",
    "awayTeam": "W. Beveren",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.23",
      "msX": "2.92",
      "ms2": "2.50",
      "turnaroundOdd": "29.14",
      "kgVar": "1.63",
      "ust25": "1.84"
    },
    "details": {
      "note": "Antwerp ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "4689d0d3-a64a-4d71-9c24-11c5f6aabfbb",
    "date": "09.08.2026",
    "time": "20:30",
    "month": "Ağustos 2026",
    "league": "Almanya : 3. Lig",
    "country": "Almanya",
    "homeTeam": "A. Aachen",
    "awayTeam": "SC Verl",
    "iyScore": "0 - 1",
    "msScore": "4 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.95",
      "msX": "3.39",
      "ms2": "2.62",
      "turnaroundOdd": "25.93",
      "kgVar": "1.27",
      "ust25": "1.31"
    },
    "details": {
      "note": "A. Aachen ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "34db5756-aa8d-4cb1-9b5c-2d710cbdd5ba",
    "date": "09.08.2026",
    "time": "23:00",
    "month": "Ağustos 2026",
    "league": "Venezuela : Premier Lig",
    "country": "Venezuela",
    "homeTeam": "Trujillanos",
    "awayTeam": "Dep. Tachira",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "4.56",
      "msX": "3.15",
      "ms2": "1.45",
      "turnaroundOdd": "20.18",
      "kgVar": "1.85",
      "ust25": "1.89"
    },
    "details": {
      "note": "Dep. Tachira ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "fbfc608c-549f-4400-a888-716041873965",
    "date": "09.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "Almanya : Bölgesel Lig",
    "country": "Almanya",
    "homeTeam": "Carl Zeiss Jena",
    "awayTeam": "Erfurt",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.55",
      "msX": "3.50",
      "ms2": "3.39",
      "turnaroundOdd": "42.48",
      "ust25": "1.26"
    },
    "details": {
      "note": "Erfurt ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "b0725001-aea1-4f9d-9ab5-661f547b8207",
    "date": "09.08.2026",
    "time": "00:15",
    "month": "Ağustos 2026",
    "league": "Bolivya : Premier Lig",
    "country": "Bolivya",
    "homeTeam": "The Strongest",
    "awayTeam": "Independiente",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.10",
      "msX": "5.35",
      "ms2": "7.86",
      "turnaroundOdd": "93.89",
      "kgVar": "1.47"
    },
    "details": {
      "note": "Independiente ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f816b580-c31c-465c-ab44-1603e589cc4a",
    "date": "09.08.2026",
    "time": "01:30",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "Orlando City",
    "awayTeam": "Leon",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.00",
      "msX": "3.24",
      "ms2": "2.41",
      "turnaroundOdd": "31.22",
      "kgVar": "1.25",
      "ust25": "1.29"
    },
    "details": {
      "note": "Leon ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "6fb317a6-2bfb-4d6d-8cc2-a0e75b775c76",
    "date": "09.08.2026",
    "time": "03:00",
    "month": "Ağustos 2026",
    "league": "Kuzey / Orta Amerika : Ligler Kupası",
    "country": "Kuzey / Orta Amerika",
    "homeTeam": "Inter Miami",
    "awayTeam": "Monterrey",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "1.99",
      "msX": "3.43",
      "ms2": "2.32",
      "turnaroundOdd": "30.18",
      "kgVar": "1.19",
      "ust25": "1.20"
    },
    "details": {
      "note": "Monterrey ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "994548a2-678e-499b-82ac-ea46e9a855fb",
    "date": "09.08.2026",
    "time": "08:00",
    "month": "Ağustos 2026",
    "league": "Avustralya : Yeni Güney Galler NPL",
    "country": "Avustralya",
    "homeTeam": "Woll. Wolves",
    "awayTeam": "Sydney Utd",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "4.06",
      "msX": "3.18",
      "ms2": "1.51",
      "turnaroundOdd": "20.86",
      "kgVar": "1.57",
      "ust25": "1.60"
    },
    "details": {
      "note": "Sydney Utd ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "f6c3623f-f3b8-4fb0-9057-33081ce27eec",
    "date": "09.08.2026",
    "time": "12:00",
    "month": "Ağustos 2026",
    "league": "Japonya : J3 Lig",
    "country": "Japonya",
    "homeTeam": "Fukushima Utd",
    "awayTeam": "Kamatamare",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "2.15",
      "msX": "2.93",
      "ms2": "2.39",
      "turnaroundOdd": "30.99",
      "kgVar": "1.45",
      "ust25": "1.59"
    },
    "details": {
      "note": "Kamatamare ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "a57e7cec-ca7e-49c3-af03-9d494e44abb8",
    "date": "09.08.2026",
    "time": "13:00",
    "month": "Ağustos 2026",
    "league": "Ukrayna : Premier Lig",
    "country": "Ukrayna",
    "homeTeam": "Zorya Luhansk",
    "awayTeam": "Kryvbas",
    "iyScore": "1 - 0",
    "msScore": "1 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.38",
      "msX": "3.63",
      "ms2": "4.36",
      "turnaroundOdd": "53.64",
      "kgVar": "1.46",
      "ust25": "1.40"
    },
    "details": {
      "note": "Kryvbas ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "162f7127-54aa-48a3-8a36-069cc093d598",
    "date": "09.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "Dünya : Hazırlık Maçları - Öne Çıkanlar",
    "country": "Dünya",
    "homeTeam": "Man. City",
    "awayTeam": "Atl. Madrid",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.53",
      "msX": "3.79",
      "ms2": "3.62",
      "turnaroundOdd": "21.09",
      "kgVar": "1.36",
      "ust25": "1.33"
    },
    "details": {
      "note": "Man. City ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "7e15b19f-5eef-4e60-b039-5ec5edc71db7",
    "date": "09.08.2026",
    "time": "14:00",
    "month": "Ağustos 2026",
    "league": "Beyaz Rusya : 1. Lig",
    "country": "Beyaz Rusya",
    "homeTeam": "Niva Dolbizno",
    "awayTeam": "Bgu Minsk",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.81",
      "msX": "3.44",
      "ms2": "2.61",
      "turnaroundOdd": "24.32",
      "kgVar": "1.25"
    },
    "details": {
      "note": "Niva Dolbizno ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "c33e1bae-cc99-40aa-bf7e-08f6eb7c0c5c",
    "date": "09.08.2026",
    "time": "15:00",
    "month": "Ağustos 2026",
    "league": "Danimarka : 1. Lig",
    "country": "Danimarka",
    "homeTeam": "Vejle",
    "awayTeam": "Hillerod",
    "iyScore": "1 - 2",
    "msScore": "5 - 4",
    "type": "2/1",
    "odds": {
      "ms1": "1.40",
      "msX": "3.53",
      "ms2": "4.39",
      "turnaroundOdd": "19.60",
      "kgVar": "1.48",
      "ust25": "1.43"
    },
    "details": {
      "note": "Vejle ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fa6466f1-3c59-46ae-a625-2db463baca9f",
    "date": "09.08.2026",
    "time": "15:30",
    "month": "Ağustos 2026",
    "league": "Norveç : 2. Lig",
    "country": "Norveç",
    "homeTeam": "Brattvag",
    "awayTeam": "Lysekloster",
    "iyScore": "0 - 1",
    "msScore": "3 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.10",
      "msX": "6.69",
      "ms2": "11.70",
      "turnaroundOdd": "27.65",
      "kgVar": "1.55",
      "ust25": "1.11"
    },
    "details": {
      "note": "Brattvag ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "69497527-b2d1-4c42-b9ef-2f21e3fdd41b",
    "date": "09.08.2026",
    "time": "16:00",
    "month": "Ağustos 2026",
    "league": "Letonya : Virsliga",
    "country": "Letonya",
    "homeTeam": "Super Nova",
    "awayTeam": "FK Liepaja",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.78",
      "msX": "3.31",
      "ms2": "1.51",
      "turnaroundOdd": "20.86",
      "kgVar": "1.49",
      "ust25": "1.50"
    },
    "details": {
      "note": "FK Liepaja ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "3b259ec0-0b5b-4128-b0e0-8bcf23cd6b6b",
    "date": "09.08.2026",
    "time": "16:30",
    "month": "Ağustos 2026",
    "league": "Dünya : Hazırlık Maçları - Öne Çıkanlar",
    "country": "Dünya",
    "homeTeam": "Liverpool",
    "awayTeam": "Monaco",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.25",
      "msX": "4.71",
      "ms2": "5.48",
      "turnaroundOdd": "66.52",
      "kgVar": "1.32",
      "ust25": "1.18"
    },
    "details": {
      "note": "Monaco ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "5083f9ed-6529-479c-95cc-a5ac359d2edc",
    "date": "09.08.2026",
    "time": "17:00",
    "month": "Ağustos 2026",
    "league": "Belçika : Pro Lig",
    "country": "Belçika",
    "homeTeam": "Zulte Waregem",
    "awayTeam": "Genk",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "2.90",
      "msX": "3.28",
      "ms2": "1.85",
      "turnaroundOdd": "36.85",
      "kgVar": "1.42",
      "ust25": "1.50"
    },
    "details": {
      "note": "Zulte Waregem ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "4937ccfc-b376-41fb-94ad-c0e2343cb142",
    "date": "09.08.2026",
    "time": "17:30",
    "month": "Ağustos 2026",
    "league": "İsviçre : Süper Lig",
    "country": "İsviçre",
    "homeTeam": "Sion",
    "awayTeam": "Vaduz",
    "iyScore": "1 - 2",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.33",
      "msX": "4.21",
      "ms2": "4.90",
      "turnaroundOdd": "18.80",
      "kgVar": "1.42",
      "ust25": "1.30"
    },
    "details": {
      "note": "Sion ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "f41d0ed4-354f-4cff-bf6f-39315a464b57",
    "date": "09.08.2026",
    "time": "18:00",
    "month": "Ağustos 2026",
    "league": "Norveç : 1. Lig",
    "country": "Norveç",
    "homeTeam": "Sandnes Ulf",
    "awayTeam": "Hodd IL",
    "iyScore": "1 - 0",
    "msScore": "3 - 4",
    "type": "1/2",
    "odds": {
      "ms1": "1.60",
      "msX": "3.25",
      "ms2": "3.39",
      "turnaroundOdd": "42.48",
      "kgVar": "1.38",
      "ust25": "1.40"
    },
    "details": {
      "note": "Hodd IL ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "36d7a1bb-ad77-4e72-94fa-90dc564032a8",
    "date": "09.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "Bulgaristan : 1. Lig",
    "country": "Bulgaristan",
    "homeTeam": "Cherno More",
    "awayTeam": "Ludogorets",
    "iyScore": "1 - 0",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "4.37",
      "msX": "3.17",
      "ms2": "1.47",
      "turnaroundOdd": "20.41",
      "kgVar": "1.74",
      "ust25": "1.76"
    },
    "details": {
      "note": "Ludogorets ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "62632e1e-d5d4-47cc-9434-60f04e7e208f",
    "date": "09.08.2026",
    "time": "19:00",
    "month": "Ağustos 2026",
    "league": "Gürcistan : Erovnuli Ligi",
    "country": "Gürcistan",
    "homeTeam": "Spaeri",
    "awayTeam": "Dinamo Tiflis",
    "iyScore": "1 - 0",
    "msScore": "1 - 2",
    "type": "1/2",
    "odds": {
      "ms1": "3.17",
      "msX": "3.18",
      "ms2": "1.68",
      "turnaroundOdd": "22.82",
      "kgVar": "1.46",
      "ust25": "1.53"
    },
    "details": {
      "note": "Dinamo Tiflis ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  },
  {
    "id": "ded7eb0d-767c-47e4-99ce-8fe7b571ae0e",
    "date": "08.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "Macaristan : NB III",
    "country": "Macaristan",
    "homeTeam": "Pápai Perutz",
    "awayTeam": "1908 SZAC",
    "iyScore": "0 - 1",
    "msScore": "2 - 1",
    "type": "2/1",
    "odds": {
      "ms1": "1.88",
      "msX": "3.17",
      "ms2": "2.66",
      "turnaroundOdd": "25.12",
      "kgVar": "1.34",
      "ust25": "1.40"
    },
    "details": {
      "note": "Pápai Perutz ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "47343df9-9724-44e2-8095-c63810148a2b",
    "date": "08.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "Macaristan : NB III",
    "country": "Macaristan",
    "homeTeam": "Mosonmagyar",
    "awayTeam": "Király SZE",
    "iyScore": "0 - 1",
    "msScore": "3 - 2",
    "type": "2/1",
    "odds": {
      "ms1": "1.63",
      "msX": "3.26",
      "ms2": "3.29",
      "turnaroundOdd": "22.24",
      "kgVar": "1.44",
      "ust25": "1.48"
    },
    "details": {
      "note": "Mosonmagyar ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 2/1 geri dönüşe imza attı."
    }
  },
  {
    "id": "fb3c4181-e21b-489b-a976-ca90554173b3",
    "date": "08.08.2026",
    "time": "18:30",
    "month": "Ağustos 2026",
    "league": "Macaristan : NB III",
    "country": "Macaristan",
    "homeTeam": "Bicskei",
    "awayTeam": "Sopron",
    "iyScore": "2 - 1",
    "msScore": "2 - 3",
    "type": "1/2",
    "odds": {
      "ms1": "1.91",
      "msX": "3.07",
      "ms2": "2.66",
      "turnaroundOdd": "34.09",
      "kgVar": "1.35",
      "ust25": "1.43"
    },
    "details": {
      "note": "Sopron ilk yarıyı geride kapattığı maçta ikinci yarıdaki golleriyle 1/2 geri dönüşe imza attı."
    }
  }
];

export function getTurnaroundStats(matches: TurnaroundMatch[] = TURNAROUND_MATCHES) {
  const total = matches.length;
  const oneTwo = matches.filter(m => m.type === '1/2').length;
  const twoOne = matches.filter(m => m.type === '2/1').length;
  const oddsList = matches.map(m => parseFloat(m.odds.turnaroundOdd)).filter(o => !isNaN(o));
  const avgOdd = oddsList.length > 0 ? (oddsList.reduce((a, b) => a + b, 0) / oddsList.length).toFixed(2) : '27.50';
  
  const leagueCounts: Record<string, number> = {};
  const leaguesSet = new Set<string>();
  const monthsSet = new Set<string>();

  matches.forEach(m => {
    if (m.league) {
      leagueCounts[m.league] = (leagueCounts[m.league] || 0) + 1;
      leaguesSet.add(m.league);
    }
    if (m.month) {
      monthsSet.add(m.month);
    }
  });

  let topLeague = '-';
  let maxCount = 0;
  Object.entries(leagueCounts).forEach(([league, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topLeague = league;
    }
  });

  return {
    total,
    totalMatches: total,
    count1to2: oneTwo,
    oneTwoCount: oneTwo,
    count2to1: twoOne,
    twoOneCount: twoOne,
    oneTwoPercent: total > 0 ? ((oneTwo / total) * 100).toFixed(1) : '0',
    twoOnePercent: total > 0 ? ((twoOne / total) * 100).toFixed(1) : '0',
    avgOdds: avgOdd,
    averageTurnaroundOdd: avgOdd,
    topLeague: { league: topLeague, count: maxCount },
    topLeagueCount: maxCount,
    leagues: Array.from(leaguesSet),
    months: Array.from(monthsSet)
  };
}
