import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// =====================================================
// CONFIGURAÇÃO DO MULTER
// =====================================================

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
    },

    fileFilter: (req, file, cb) => {

        const tiposPermitidos = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Formato de imagem não permitido. Use JPG, JPEG, PNG, WEBP ou GIF."
                )
            );
        }

        cb(null, true);
    },
});

// =====================================================
// UPLOAD PARA CLOUDINARY
// =====================================================

const enviarParaCloudinary = (buffer, options = {}) => {

    return new Promise((resolve, reject) => {

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder:
                        options.folder ||
                        "agenda-salao/produtos",

                    resource_type: "image",

                    transformation: [
                        {
                            width: 1200,
                            height: 1200,
                            crop: "limit",
                            quality: "auto",
                            fetch_format: "auto",
                        },
                    ],
                },

                (error, resultado) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(resultado);
                }
            );

        Readable.from(buffer).pipe(uploadStream);
    });
};

// =====================================================
// MIDDLEWARE FINAL
// =====================================================

const uploadImagemProduto = async (req, res, next) => {

    try {

        if (!req.file) {
            return next();
        }

        console.log(
            "Imagem recebida:",
            req.file.originalname
        );

        console.log(
            "Tipo:",
            req.file.mimetype
        );

        console.log(
            "Tamanho:",
            req.file.size
        );

        // -------------------------------------------------
        // ENVIAR PARA CLOUDINARY
        // -------------------------------------------------

        const resultado =
            await enviarParaCloudinary(
                req.file.buffer,
                {
                    folder:
                        "agenda-salao/produtos",
                }
            );

        // -------------------------------------------------
        // COLOCAR DADOS NO req.file
        // -------------------------------------------------

        req.file.cloudinary = {
            public_id:
                resultado.public_id,

            secure_url:
                resultado.secure_url,

            url:
                resultado.url,

            width:
                resultado.width,

            height:
                resultado.height,

            format:
                resultado.format,

            resource_type:
                resultado.resource_type,
        };

        // Compatibilidade com o controller
        req.file.public_id =
            resultado.public_id;

        req.file.filename =
            resultado.public_id;

        req.file.cloudinary_id =
            resultado.public_id;

        req.file.path =
            resultado.secure_url;

        req.file.secure_url =
            resultado.secure_url;

        req.file.url =
            resultado.url;

        console.log(
            "Imagem enviada para Cloudinary:"
        );

        console.log(
            "Public ID:",
            resultado.public_id
        );

        console.log(
            "URL:",
            resultado.secure_url
        );

        next();

    } catch (erro) {

        console.error(
            "Erro ao enviar imagem para Cloudinary:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao enviar a imagem para o Cloudinary.",

            erro:
                process.env.NODE_ENV ===
                "production"
                    ? undefined
                    : erro.message,
        });
    }
};

// =====================================================
// EXPORTAÇÕES
// =====================================================

// Upload de uma imagem
export const uploadProduto =
    upload.single("imagem");

// Middleware Cloudinary
export const enviarImagemCloudinary =
    uploadImagemProduto;

// Middleware combinado
export const uploadImagemProdutoCloudinary = [
    upload.single("imagem"),
    uploadImagemProduto,
];

export default upload;