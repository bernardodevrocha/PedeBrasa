"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBlogPosts = listBlogPosts;
exports.createBlogPost = createBlogPost;
exports.updateBlogPost = updateBlogPost;
exports.getMyBlogProfile = getMyBlogProfile;
const sequelize_1 = require("sequelize");
const BlogPost_1 = require("../../models/blog/BlogPost");
const Churrasqueiro_1 = require("../../models/churrasqueiros/Churrasqueiro");
function parsePayload(req) {
    return req.body;
}
function normalizeBlocks(input) {
    if (!Array.isArray(input) || input.length === 0) {
        throw new Error("contentBlocks deve conter ao menos um bloco");
    }
    return input.map((block) => {
        if (!block || typeof block !== "object") {
            throw new Error("Cada bloco do blog deve ser um objeto valido");
        }
        if (block.type === "text") {
            const text = typeof block.text === "string" ? block.text.trim() : "";
            if (!text) {
                throw new Error("Blocos de texto precisam ter conteudo");
            }
            return {
                type: "text",
                text,
            };
        }
        if (block.type === "image") {
            const imageUrl = typeof block.imageUrl === "string" ? block.imageUrl.trim() : "";
            const caption = typeof block.caption === "string" ? block.caption.trim() : "";
            if (!imageUrl) {
                throw new Error("Blocos de imagem precisam ter imageUrl");
            }
            return caption
                ? {
                    type: "image",
                    imageUrl,
                    caption,
                }
                : {
                    type: "image",
                    imageUrl,
                };
        }
        throw new Error("Tipo de bloco invalido");
    });
}
function getExcerpt(blocks) {
    const firstText = blocks.find((block) => block.type === "text" && block.text);
    if (!firstText?.text) {
        return null;
    }
    return firstText.text.length > 160
        ? `${firstText.text.slice(0, 157)}...`
        : firstText.text;
}
async function getCurrentChurrasqueiro(userId) {
    return Churrasqueiro_1.Churrasqueiro.findOne({
        where: { userId },
        order: [["id", "ASC"]],
    });
}
async function resolveBlogAuthorProfile(req) {
    if (!req.user) {
        return { error: "Nao autenticado", status: 401 };
    }
    if (req.user.role !== "churrasqueiro" && req.user.role !== "admin") {
        return {
            error: "Apenas admins ou usuarios com role de churrasqueiro podem publicar",
            status: 403,
        };
    }
    const churrasqueiro = await getCurrentChurrasqueiro(req.user.sub);
    if (!churrasqueiro) {
        return {
            error: "Seu usuario pode publicar, mas ainda nao possui um perfil de churrasqueiro vinculado",
            status: 403,
        };
    }
    return { churrasqueiro };
}
async function buildBlogResponse(items) {
    if (items.length === 0) {
        return [];
    }
    const churrasqueiroIds = Array.from(new Set(items.map((item) => item.churrasqueiroId)));
    const churrasqueiros = await Churrasqueiro_1.Churrasqueiro.findAll({
        where: { id: { [sequelize_1.Op.in]: churrasqueiroIds } },
    });
    const authorById = new Map(churrasqueiros.map((item) => [item.id, item]));
    return items.map((item) => {
        const contentBlocks = JSON.parse(item.content);
        const author = authorById.get(item.churrasqueiroId);
        return {
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            excerpt: getExcerpt(contentBlocks),
            contentBlocks,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            author: author
                ? {
                    id: author.id,
                    name: author.name,
                    city: author.city,
                    imgChurrasqueiro: author.imgChurrasqueiro,
                }
                : null,
        };
    });
}
async function listBlogPosts(req, res) {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const items = await BlogPost_1.BlogPost.findAll({
        ...(search
            ? {
                where: {
                    [sequelize_1.Op.or]: [
                        { title: { [sequelize_1.Op.like]: `%${search}%` } },
                        { subtitle: { [sequelize_1.Op.like]: `%${search}%` } },
                    ],
                },
            }
            : {}),
        order: [
            ["updatedAt", "DESC"],
            ["id", "DESC"],
        ],
    });
    return res.json(await buildBlogResponse(items));
}
async function createBlogPost(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const currentUser = req.user;
    const payload = parsePayload(req);
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const subtitle = typeof payload.subtitle === "string" ? payload.subtitle.trim() : "";
    if (!title) {
        return res.status(400).json({ message: "title e obrigatorio" });
    }
    const authorProfile = await resolveBlogAuthorProfile(req);
    if (!("churrasqueiro" in authorProfile)) {
        return res.status(authorProfile.status).json({
            message: authorProfile.error,
        });
    }
    let blocks;
    try {
        blocks = normalizeBlocks(payload.contentBlocks);
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Conteudo do blog invalido",
        });
    }
    const item = await BlogPost_1.BlogPost.create({
        userId: currentUser.sub,
        churrasqueiroId: Number(authorProfile.churrasqueiro.id),
        title,
        subtitle: subtitle || null,
        content: JSON.stringify(blocks),
    });
    const [responseItem] = await buildBlogResponse([item]);
    return res.status(201).json(responseItem);
}
async function updateBlogPost(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const item = await BlogPost_1.BlogPost.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Postagem nao encontrada" });
    }
    if (item.userId !== req.user.sub && req.user.role !== "admin") {
        return res.status(403).json({
            message: "Voce nao pode editar esta postagem",
        });
    }
    const payload = parsePayload(req);
    if (typeof payload.title === "string" && payload.title.trim()) {
        item.title = payload.title.trim();
    }
    if (typeof payload.subtitle === "string" || payload.subtitle === null) {
        item.subtitle = payload.subtitle?.trim() || null;
    }
    if (payload.contentBlocks) {
        try {
            item.content = JSON.stringify(normalizeBlocks(payload.contentBlocks));
        }
        catch (error) {
            return res.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Conteudo do blog invalido",
            });
        }
    }
    await item.save();
    const [responseItem] = await buildBlogResponse([item]);
    return res.json(responseItem);
}
async function getMyBlogProfile(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const authorProfile = await resolveBlogAuthorProfile(req);
    if (!("churrasqueiro" in authorProfile)) {
        return res.status(authorProfile.status).json({
            message: authorProfile.error,
        });
    }
    return res.json({
        id: Number(authorProfile.churrasqueiro.id),
        name: authorProfile.churrasqueiro.name,
        city: authorProfile.churrasqueiro.city,
        imgChurrasqueiro: authorProfile.churrasqueiro.imgChurrasqueiro,
    });
}
//# sourceMappingURL=blogController.js.map