# NairiBook Integration

NairiBook is the generative knowledge engine of the Nairi Ecosystem, designed to transform static documentation into interactive, explorable knowledge spaces.

## Overview
NairiBook functions as a specialized knowledge management component that maps unstructured document data into structured, interactive environments.

## Architecture
1. **Ingestion**: PDFs and other documents are parsed and chunked using LangChain.
2. **Synthesis**: Concepts are distilled using LLMs (Llama 3.1) via the vLLM backend.
3. **Knowledge Mapping**: Synthesized data is mapped into queryable vector stores (FAISS) and structured knowledge graphs.
4. **Interaction**: Users explore this knowledge through the Nairi interface, leveraging RAG-driven responses and interactive simulations.

## Integration Guidelines
- Ensure the NairiBook backend service is accessible at the configured API endpoint.
- Use the shared state management for knowledge retrieval to maintain session context.
- Follow the established protocol for adding new document types via the Ingestion service.

## Development
To extend NairiBook functionality:
1. Modify the ingestion pipeline in `src/engine.py`.
2. Update the frontend visualization component in the Nairi core.
3. Test integration with existing agent workflows.
