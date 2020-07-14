import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { Link, useHistory } from 'react-router-dom';
import api from '../../services/api';
import axios from 'axios';

import './styles.css';

import logo from '../../assets/logo.svg';
import { LeafletMouseEvent } from 'leaflet';

import Dropzone from '../../components/Dropzone';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUF {
    sigla: string;
}

interface IBGECity {
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]); 
    const [initialPos, setInitialPos] = useState<[number, number]>([0,0]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });

    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const [ufs, setUfs] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [citys, setCitys] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPos, setSelectedPos] = useState<[number, number]>([0,0]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPos([latitude, longitude]);
        });
    }, []);

    useEffect(() => {
        api.get('/items')
        .then(response => {
            setItems(response.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUF[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);

            setUfs(ufInitials);
        });
    }, []);

    useEffect(() => {
        // carregar as cidades sempre que a UF mudar
        if(selectedUf === '0') {
            return;
        }

        axios
        .get<IBGECity[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(response => {
            const cityNames = response.data.map(city => city.nome);

            setCitys(cityNames);
        });
    }, [selectedUf]);

    // Seleciona UF
    function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;

        setSelectedUf(uf);
    }

    // Seleciona Cidade
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;

        setSelectedCity(city);
    }

    // Seleciona localização no mapa
    function handleMap(event: LeafletMouseEvent) {
        setSelectedPos([
            event.latlng.lat,
            event.latlng.lng,
        ])
    }

    // Pega os dados dos inputs (Nome, E-mail, Whatsapp)
    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    }

    // Seleciona os itens de coleta
    function handleSelectItem(id: number) {
        const selected = selectedItems.findIndex(item => item === id);

        if(selected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([ ...selectedItems, id ]);
        }
    }

    // Cadastra ponto de coleta no Banco de Dados (API)
    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        console.log(selectedFile);


        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPos;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));

        if(selectedFile) {
            data.append('image', selectedFile);
        }

        await api.post('points', data);
        alert('Ponto de coleta criado!');
        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/" >
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                                <input 
                                    type="email"
                                    name="email"
                                    id="email"
                                    onChange={handleInputChange}
                                />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input 
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map 
                        center={initialPos} 
                        zoom={15}
                        onClick={handleMap}
                    >
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPos}  />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUF}>
                                <option value="0">Selecione uma UF</option>
                                { ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                )) }
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma cidade</option>
                                { citys.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                )) }
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        { items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={ selectedItems.includes(item.id) ? 'selected' : '' }
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        )) }
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
}

export default CreatePoint;