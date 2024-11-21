const express = require('express');
const { CohereClient } = require('cohere-ai');
const router = express.Router();

// Inicialización del cliente de Cohere
const cohere = new CohereClient({
    token: 'YTDS77peZNTkZWwUFrIb5SWxXvldPtQJ56IbG79s', // Reemplaza por tu token válido
});

// Rutas
router.get('/buscador_ia', function(req, res) {
    if (req.session.loggedin) {
        res.render('./AI/buscador_ai');
    } else {
        res.render("./paginas/logout");
    }
});

// Temas permitidos para validar consultas
const allowedTopics = [
    "medicamentos",
    "farmacología",
    "tratamientos médicos",
    "enfermedades",
    "síntomas",
    "interacciones medicamentosas"
];

router.post('/buscar', async (req, res) => {
    const { medicamento } = req.body;

    // Validar si el campo medicamento está vacío
    if (!medicamento || medicamento.trim() === '') {
        return res.status(400).json({ error: 'La consulta no puede estar vacía. Ingresa un síntoma o medicamento válido.' });
    }

    try {
        // Llamar a la API de Cohere con un prompt más enfocado
        const response = await cohere.generate({
            model: 'command-xlarge-nightly',
            prompt: `Estoy buscando información sobre "${medicamento}". Proporciona detalles específicos solo si está relacionado con medicamentos, tratamientos, síntomas o temas médicos. Si no está relacionado, responde exactamente con: "Consulta no válida".`,
            max_tokens: 300,
            temperature: 0.5, // Reducir la creatividad de las respuestas
        });

        const respuesta = response.generations[0]?.text?.trim();

        // Validar respuesta de la API
        if (!respuesta || respuesta.toLowerCase() === 'consulta no válida') {
            return res.json({
                informacion: 'Consulta no válida. Por favor, realiza una búsqueda relacionada con medicamentos, síntomas o temas médicos.',
            });
        }

        // Validar que la respuesta contenga información médica
        const medicalKeywords = ["medicamento", "tratamiento", "síntoma", "farmacología", "enfermedad", "receta", "farmacia", "jarabe", "tos", "pastillas"];
        const containsMedicalKeyword = medicalKeywords.some(keyword =>
            respuesta.toLowerCase().includes(keyword)
        );

        if (!containsMedicalKeyword) {
            return res.json({
                informacion: 'Consulta no válida. Por favor, realiza una búsqueda relacionada con medicamentos, síntomas o temas médicos.',
            });
        }

        // Responder con la información procesada
        res.json({ informacion: respuesta });
    } catch (error) {
       
        res.status(500).json({ error: 'Hubo un problema al procesar la consulta. Por favor, inténtalo de nuevo más tarde.' });
    }
});


module.exports = router;
