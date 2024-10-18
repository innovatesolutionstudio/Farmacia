const express = require('express');
const { CohereClient } = require('cohere-ai');
const router = express.Router();

const cohere = new CohereClient({
    token: 'YTDS77peZNTkZWwUFrIb5SWxXvldPtQJ56IbG79s',
});

router.get('/buscador_ia', function(req, res) {
    res.render('./AI/buscador_ai');
});

// Ruta para manejar las solicitudes de búsqueda
router.post('/buscar', async (req, res) => {
    const { medicamento } = req.body;

    try {
        const response = await cohere.generate({
            model: 'command-xlarge-nightly',
            prompt: `Dame información sobre ${medicamento}, quiero datos especificos para un cliente de una farmacia .`,
            max_tokens: 1000,
        });
        // Verifica la estructura de la respuesta
        if (response && response.generations && response.generations.length > 0) {
            const respuesta = response.generations[0].text.trim();
            res.json({ informacion: respuesta });
        } else {
            throw new Error('La respuesta de la API no contiene datos esperados.');
        }
    } catch (error) {
        console.error('Error al obtener información de Cohere:', error);
        res.status(500).json({ error: 'Error al obtener información de Cohere' });
    }
});

module.exports = router;
