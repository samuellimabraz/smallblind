# PBLC01 - DESENVOLVIMENTO DE PROJETO DE SOFTWARE 

## Escopo do Projeto Atualizado

### 1. Descrição Geral

#### 1.1 Nome do Produto

- **Nome do Produto**: **Small Blind**  
- **URL do Produto**: [https://www.smallblind.com/](https://www.smallblind.com/)

---

#### 1.2 Escopo do Produto

**Funcionalidades do Produto**  
Small Blind é um aplicativo móvel voltado para auxiliar pessoas com deficiência visual, fornecendo uma interpretação multimodal do ambiente ao seu redor. O produto utiliza uma arquitetura de microserviços baseada em modelos de IA leves para:

- **Image Captioning:** Gerar descrições detalhadas em tempo real das cenas capturadas pela câmera usando modelos otimizados como SmolVLM2.
- **Visual Question Answering (VQA):** Permitir que o usuário faça perguntas sobre o ambiente e receba respostas auditivas através da integração de processamento de imagem e linguagem natural.
- **Reconhecimento Óptico de Caracteres (OCR):** Detectar e ler textos presentes em imagens usando modelos OCR leves como SmolDocling-256M.
- **Detecção de Obstáculos:** Alertar sobre obstáculos próximos usando modelos como TinyYOLOv8 para detecção de objetos.
- **Reconhecimento Facial:** Identificar pessoas registradas previamente usando modelos como FaceNet-ONNX para extração de embeddings faciais.
- **Conversão de Texto para Fala (TTS):** Transformar respostas textuais em feedback auditivo utilizando modelos como Bark-small.
- **Conversão de Fala para Texto (STT):** Processar comandos de voz usando modelos como Whisper Tiny para interação por voz.

**Arquitetura do Sistema**

O sistema segue uma arquitetura de microserviços estruturada em camadas:

1. **Camada de API Gateway:**
   - Gerencia autenticação, roteamento e balanceamento de carga
   - Implementa rate limiting para proteção dos serviços
   - Centraliza logging e monitoramento

2. **Camada de Serviços:**
   - **Vision API Service:** Processa tarefas relacionadas a imagens (captioning, detecção de objetos)
   - **Speech API Service:** Gerencia conversão de texto para fala e vice-versa
   - **Text API Service:** Realiza processamento de texto e OCR
   - **User/Profile API Service:** Gerencia dados de usuário e preferências

3. **Camada de Gerenciamento de Modelos:**
   - Seleciona modelos baseados em requisitos de recursos e tarefas
   - Otimiza modelos via quantização e compressão
   - Gerencia carregamento/descarregamento dinâmico de modelos

4. **Camada de Persistência:**
   - MongoDB para dados de usuário e sessões
   - Redis para caching e armazenamento temporário
   - Milvus/Qdrant para banco de dados vetoriais (reconhecimento facial)

5. **Camada de Comunicação em Tempo Real:**
   - WebSockets para streaming de resultados de processamento de fala e visão
   - Notificações em tempo real para alertas

**Limitações**

- Não substitui sistemas especializados de navegação (por exemplo, GPS assistido para deficientes visuais).
- Desempenho varia de acordo com capacidades do dispositivo (os modelos são adaptados dinamicamente).
- Não é destinado a tarefas de segurança crítica, como a detecção de veículos em movimento.
- Reconhecimento facial limitado a pessoas previamente registradas pelo usuário.

**Objetivos e Metas**

- **Autonomia:** Proporcionar maior independência a usuários com deficiência visual em ambientes desconhecidos.
- **Acessibilidade:** Reduzir a dependência de assistência humana, tornando a interpretação do ambiente mais acessível através de feedback auditivo e tátil.
- **Eficiência em Dispositivos Móveis:** Otimizar modelos de IA para execução eficiente em dispositivos com recursos limitados.
- **Personalização:** Permitir ajustes de preferências de usuário para velocidade de fala, detalhamento das descrições e tipos de alertas.
- **Open-Source e Customizável:** Disponibilizar a solução como código aberto, permitindo que comunidades e desenvolvedores personalizem e integrem novas funcionalidades conforme suas necessidades.

---

#### 1.3 Características do Usuário

- **Usuários Primários:**  
    
  - Pessoas com deficiência visual total ou parcial.  
  - Idade mínima: 15 anos (com familiaridade básica com smartphones).  
  - Necessidades: Receber descrições auditivas de ambientes, reconhecimento de textos e identificação de obstáculos.


- **Usuários Secundários:**  
    
  - Cuidadores e familiares, que podem configurar preferências (como a velocidade da fala e intensidade do feedback).  
  - Desenvolvedores interessados em contribuir com o projeto, adicionando novos modelos ou funcionalidades via código aberto.

---

#### 1.4 Local de Disponibilização

- **Repositório GitHub:** [https://github.com/samuellimabraz/smallblind](https://github.com/samuellimabraz/smallblind)
- **Documentação API:** Disponível via Swagger/OpenAPI no próprio repositório
- **Imagens Docker:** Disponíveis para implantação fácil dos microserviços

---

#### 1.5 Licenciamento

- **Licença Principal:** **MIT** – Permite uso comercial, modificações e distribuição, exigindo apenas atribuição adequada.  
- **Licenças de Dependências:**  
  - Modelos de IA seguem licenças específicas do Hugging Face (por exemplo, Apache 2.0 para BLIP-2).  
  - Bibliotecas utilizadas (como TensorFlow.js e transformers-js) são compatíveis com a licença MIT.

---

#### 1.6 Tecnologias e Modelos Utilizados

1. **Modelos de IA:**

   - **SmolVLM2** (ONNX, ~300MB): Captioning geral e VQA
   - **SmolDocling-256M** (ONNX, ~256MB): Processamento de documentos
   - **TinyYOLOv8** (ONNX, ~6MB): Detecção de objetos
   - **FaceNet-ONNX** (ONNX, ~30MB): Detecção facial e geração de embeddings
   - **Whisper Tiny** (ONNX, ~75MB): Conversão de fala para texto
   - **Bark-small** (ONNX, ~140MB): Conversão de texto para fala

2. **Stack Tecnológico:**  
     
   - **Backend:** Node.js com TypeScript, Express.js, Socket.IO para WebSockets
   - **Gerenciamento de Modelos:** ONNX Runtime, TensorFlow.js, transformers-js
   - **Bancos de Dados:** MongoDB, Redis, Milvus/Qdrant
   - **Autenticação:** JWT, OAuth 2.0
   - **Implantação:** Docker, Kubernetes
   - **CI/CD:** GitHub Actions
   - **Frontend:** React Native com Next.js, Vision Camera

3. **Aplicações Similares:**  
     
   - [Seeing AI](https://www.microsoft.com/en-us/ai/seeing-ai) – Aplicativo da Microsoft para deficientes visuais.  
   - [Hugging Snap](https://apps.apple.com/br/app/huggingsnap/id6742157364) – Demonstração de inferência multimodal da Hugging Face.

---

### 1.7 Fluxos Operacionais Principais

1. **Fluxo de Descrição de Imagens:**
   - Usuário captura imagem via React Native Vision Camera
   - Imagem é pré-processada no dispositivo
   - API Gateway autentica e roteia a requisição
   - Vision API seleciona o modelo adequado (SmolVLM2)
   - Resultado é convertido em fala via Speech API
   - Feedback é transmitido ao usuário

2. **Fluxo de Perguntas Visuais:**
   - Usuário captura imagem e faz pergunta (texto ou voz)
   - Se for áudio, Speech-to-Text converte para texto
   - QA Service processa imagem e pergunta
   - Resposta é convertida em fala e enviada ao usuário

3. **Fluxo de Reconhecimento Facial:**
   - Usuário ativa modo de reconhecimento facial
   - Face Recognition Service detecta faces e gera embeddings
   - Vector Database realiza busca por similaridade
   - Identidades reconhecidas são anunciadas via TTS

---
