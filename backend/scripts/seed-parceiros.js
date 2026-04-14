const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const databasePath =
  process.env.DB_PATH || path.join(__dirname, "..", "data", "pedebrasa.sqlite");

const parceiros = [
  {
    name: "Brasa Nobre Carnes",
    category: "Acougue Premium",
    description:
      "Boutique de carnes especiais com cortes maturados e kits para churrasco premium.",
    featuredProducts: "Picanha Angus, ancho, short rib, linguiça artesanal",
    location: "Av. Miguel Sutil, 1240 - Jardim Cuiaba",
    city: "Cuiaba",
    phone: "(65) 99210-1101",
    openingHours: "Seg a Sab - 08:00 as 19:00",
    couponCode: "BRASANOBRE10",
    validUntil: "2027-12-31",
  },
  {
    name: "Adega Fogo & Malte",
    category: "Bebidas",
    description:
      "Loja especializada em cervejas artesanais, whiskies e vinhos para harmonizacao de eventos.",
    featuredProducts: "IPA regional, chopp em barril, whisky 12 anos, vinho malbec",
    location: "Rua das Palmeiras, 87 - Goiabeiras",
    city: "Cuiaba",
    phone: "(65) 99210-1102",
    openingHours: "Seg a Sex - 10:00 as 22:00",
    couponCode: "FOGOEMALTE12",
    validUntil: "2027-12-31",
  },
  {
    name: "Mesa de Ouro Locações",
    category: "Locacao de Utensilios",
    description:
      "Aluguel de mesas, cadeiras, talheres e ilhas gourmet para eventos ao ar livre.",
    featuredProducts: "Mesas rusticas, cadeiras Tiffany, sousplat, ilhas de apoio",
    location: "Av. Fernando Correa, 2100 - Coxipo",
    city: "Cuiaba",
    phone: "(65) 99210-1103",
    openingHours: "Seg a Sab - 08:00 as 18:00",
    couponCode: "MESAOURO15",
    validUntil: "2027-12-31",
  },
  {
    name: "Gelo Polar Eventos",
    category: "Gelo e Resfriados",
    description:
      "Fornecimento de gelo em escama, cubo e caixas termicas para festas de pequeno e medio porte.",
    featuredProducts: "Gelo em cubo, gelo de escama, caixas termicas, freezer horizontal",
    location: "Rua Comandante Costa, 455 - Porto",
    city: "Cuiaba",
    phone: "(65) 99210-1104",
    openingHours: "Todos os dias - 06:00 as 23:00",
    couponCode: "POLAR8",
    validUntil: "2027-12-31",
  },
  {
    name: "Verde Tempero Hortifruti",
    category: "Hortifruti",
    description:
      "Selecao de legumes, frutas e ervas frescas para saladas, acompanhamentos e finalizacao.",
    featuredProducts: "Alho confitado, chimichurri fresco, saladas gourmet, legumes grelhados",
    location: "Av. das Torres, 980 - Santa Cruz",
    city: "Cuiaba",
    phone: "(65) 99210-1105",
    openingHours: "Seg a Dom - 07:00 as 20:00",
    couponCode: "VERDETEMPERO7",
    validUntil: "2027-12-31",
  },
  {
    name: "Doce Brasa Sobremesas",
    category: "Sobremesas",
    description:
      "Doceria para fechar o evento com brownies, banoffee, pudim e mesa de doces autorais.",
    featuredProducts: "Brownie de brasa, banoffee, pudim de leite, cheesecake",
    location: "Rua 24 de Outubro, 311 - Centro Sul",
    city: "Cuiaba",
    phone: "(65) 99210-1106",
    openingHours: "Ter a Dom - 11:00 as 20:00",
    couponCode: "DOCEBRASA10",
    validUntil: "2027-12-31",
  },
  {
    name: "Som de Quintal",
    category: "Musica Ao Vivo",
    description:
      "Trio acustico e estrutura de sonorizacao para churrascos, aniversarios e confraternizacoes.",
    featuredProducts: "Voz e violao, samba leve, som ambiente, DJ lounge",
    location: "Rua Estevao de Mendonca, 522 - Quilombo",
    city: "Cuiaba",
    phone: "(65) 99210-1107",
    openingHours: "Seg a Sex - 09:00 as 18:00",
    couponCode: "SOMQUINTAL5",
    validUntil: "2027-12-31",
  },
  {
    name: "Casa da Fumaca",
    category: "Defumados Artesanais",
    description:
      "Especialista em brisket, costela defumada e acompanhamentos para experiencias barbecue.",
    featuredProducts: "Brisket, pork ribs, pulled pork, molho barbecue da casa",
    location: "Av. Historiador Rubens de Mendonca, 1500 - Bosque da Saude",
    city: "Cuiaba",
    phone: "(65) 99210-1108",
    openingHours: "Qua a Dom - 10:00 as 21:00",
    couponCode: "FUMACA12",
    validUntil: "2027-12-31",
  },
  {
    name: "Floratta Decor",
    category: "Decoracao",
    description:
      "Decoracao de mesas, lounges e ambientacao para eventos premium e corporativos.",
    featuredProducts: "Arranjos naturais, lounges externos, iluminacao cenario, mesas posta",
    location: "Rua Jornalista Amaro de Figueiredo Falcao, 120 - Duque de Caxias",
    city: "Cuiaba",
    phone: "(65) 99210-1109",
    openingHours: "Seg a Sab - 09:00 as 18:30",
    couponCode: "FLORATTA10",
    validUntil: "2027-12-31",
  },
  {
    name: "Chef em Casa Kids",
    category: "Recreacao Infantil",
    description:
      "Espaco kids e monitores para manter as criancas entretidas durante o evento.",
    featuredProducts: "Monitoria, oficinas, brinquedos inflaveis, pintura facial",
    location: "Rua Jornalista Alves de Oliveira, 64 - Jardim das Americas",
    city: "Cuiaba",
    phone: "(65) 99210-1110",
    openingHours: "Seg a Dom - 08:00 as 19:00",
    couponCode: "KIDSBRASA6",
    validUntil: "2027-12-31",
  },
];

const insertSql = `
  INSERT INTO parceiros (
    name,
    category,
    description,
    featuredProducts,
    location,
    city,
    phone,
    openingHours,
    couponCode,
    validUntil,
    createdAt,
    updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`;

function runStatement(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this);
    });
  });
}

function getSingle(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

async function seedParceiros() {
  const db = new sqlite3.Database(databasePath);

  try {
    await runStatement(db, "BEGIN TRANSACTION");

    let inserted = 0;
    let skipped = 0;

    for (const parceiro of parceiros) {
      const existing = await getSingle(
        db,
        "SELECT id FROM parceiros WHERE couponCode = ?",
        [parceiro.couponCode],
      );

      if (existing) {
        skipped += 1;
        continue;
      }

      await runStatement(db, insertSql, [
        parceiro.name,
        parceiro.category,
        parceiro.description,
        parceiro.featuredProducts,
        parceiro.location,
        parceiro.city,
        parceiro.phone,
        parceiro.openingHours,
        parceiro.couponCode,
        parceiro.validUntil,
      ]);

      inserted += 1;
    }

    await runStatement(db, "COMMIT");

    console.log(`Seed finalizado. Inseridos: ${inserted}. Ignorados: ${skipped}.`);
    console.log(`Banco utilizado: ${databasePath}`);
  } catch (error) {
    await runStatement(db, "ROLLBACK").catch(() => undefined);
    console.error("Falha ao popular parceiros:", error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

seedParceiros();
