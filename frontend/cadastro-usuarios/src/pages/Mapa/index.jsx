
import "./style.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";

const LOCALIZACAO_INICIAL = {
  lat: -27.8167,
  lng: -50.3264,
};

async function buscarEndereco(coordenadas) {
  const parametros = new URLSearchParams({
    format: "jsonv2",
    lat: String(coordenadas.lat),
    lon: String(coordenadas.lng),
    "accept-language": "pt-BR",
  });

  const resposta = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${parametros}`
  );

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar o endereço.");
  }

  const dados = await resposta.json();
  return dados.display_name || "Endereço não identificado";
}

async function buscarCoordenadas(endereco) {
  const parametros = new URLSearchParams({
    q: endereco,
    format: "jsonv2",
    limit: "1",
    countrycodes: "br",
    "accept-language": "pt-BR",
  });

  const resposta = await fetch(
    `https://nominatim.openstreetmap.org/search?${parametros}`
  );

  if (!resposta.ok) {
    throw new Error("Não foi possível pesquisar o endereço.");
  }

  const resultados = await resposta.json();

  if (!resultados.length) {
    throw new Error("Endereço não encontrado. Tente informar rua, cidade e estado.");
  }

  return {
    lat: Number(resultados[0].lat),
    lng: Number(resultados[0].lon),
    endereco: resultados[0].display_name,
  };
}

function ControladorMapa({ localizacao }) {
  const mapa = useMap();

  useEffect(() => {
    mapa.setView([localizacao.lat, localizacao.lng], 16);
  }, [mapa, localizacao]);

  return null;
}

function CliqueNoMapa({ onSelecionar }) {
  useMapEvents({
    click(evento) {
      onSelecionar({
        lat: evento.latlng.lat,
        lng: evento.latlng.lng,
      });
    },
  });

  return null;
}

export default function MapaColeta({
  compact = false,
  onSelectionChange,
}) {
  const [localizacao, setLocalizacao] = useState(LOCALIZACAO_INICIAL);
  const [endereco, setEndereco] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function selecionarLocal(coordenadas, enderecoConhecido) {
    setLocalizacao({
      lat: coordenadas.lat,
      lng: coordenadas.lng,
    });

    setCarregando(true);
    setMensagem("");

    try {
      const enderecoEncontrado =
        enderecoConhecido || await buscarEndereco(coordenadas);

      setEndereco(enderecoEncontrado);

      onSelectionChange?.({
        endereco: enderecoEncontrado,
        coordenadas: {
          lat: coordenadas.lat,
          lng: coordenadas.lng,
        },
        latitude: coordenadas.lat,
        longitude: coordenadas.lng,
      });
    } catch (erro) {
      setMensagem(
        erro.message || "Não foi possível identificar o endereço."
      );

      onSelectionChange?.({
        endereco: "",
        coordenadas: {
          lat: coordenadas.lat,
          lng: coordenadas.lng,
        },
        latitude: coordenadas.lat,
        longitude: coordenadas.lng,
      });
    } finally {
      setCarregando(false);
    }
  }

  async function pesquisarEndereco(evento) {
    evento.preventDefault();

    if (!pesquisa.trim()) {
      setMensagem("Digite um endereço para pesquisar.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await buscarCoordenadas(pesquisa.trim());

      await selecionarLocal(
        {
          lat: resultado.lat,
          lng: resultado.lng,
        },
        resultado.endereco
      );
    } catch (erro) {
      setMensagem(erro.message || "Erro ao pesquisar endereço.");
      setCarregando(false);
    }
  }

  function usarLocalizacaoAtual() {
    setMensagem("");

    if (!navigator.geolocation) {
      setMensagem("Seu navegador não oferece geolocalização.");
      return;
    }

    setCarregando(true);

    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        await selecionarLocal({
          lat: posicao.coords.latitude,
          lng: posicao.coords.longitude,
        });
      },
      (erro) => {
        const mensagens = {
          1: "Permita o acesso à localização nas configurações do navegador.",
          2: "Não foi possível identificar sua localização.",
          3: "A localização demorou demais. Tente novamente.",
        };

        setMensagem(
          mensagens[erro.code] || "Não foi possível obter sua localização."
        );
        setCarregando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <section className={`mapa-coleta ${compact ? "mapa-compacto" : ""}`}>
      <form className="mapa-busca" onSubmit={pesquisarEndereco}>
        <input
          type="text"
          value={pesquisa}
          onChange={(evento) => setPesquisa(evento.target.value)}
          placeholder="Digite rua, número e cidade..."
          aria-label="Pesquisar endereço de coleta"
        />

        <button type="submit" disabled={carregando}>
          Pesquisar
        </button>
      </form>

      <button
        className="mapa-localizacao-btn"
        type="button"
        onClick={usarLocalizacaoAtual}
        disabled={carregando}
      >
        Usar minha localização atual
      </button>

      {carregando && (
        <p className="mapa-status">Buscando localização...</p>
      )}

      {mensagem && (
        <p className="mapa-mensagem" role="status">
          {mensagem}
        </p>
      )}

      <div className="mapa-container">
        <MapContainer
          center={[LOCALIZACAO_INICIAL.lat, LOCALIZACAO_INICIAL.lng]}
          zoom={14}
          scrollWheelZoom
          className="mapa-leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ControladorMapa localizacao={localizacao} />

          <CliqueNoMapa onSelecionar={(coordenadas) => selecionarLocal(coordenadas)} />

          <CircleMarker
            center={[localizacao.lat, localizacao.lng]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#1677ff",
              fillOpacity: 1,
            }}
          />
        </MapContainer>
      </div>

      {endereco && (
        <div className="mapa-endereco-selecionado">
          <strong>Endereço selecionado</strong>
          <p>{endereco}</p>
        </div>
      )}

      <p className="mapa-instrucao">
        Pesquise um endereço ou clique no mapa para selecionar o local de coleta.
      </p>
    </section>
  );
}
