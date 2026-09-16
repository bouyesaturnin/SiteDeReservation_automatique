import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users, Tag } from 'lucide-react';

const RoomList = () => {
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        api.get('rooms/')
            .then(res => setRooms(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1 className="text-3xl font-bold text-blue-600 underline">
                Nos chambres disponibles
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {rooms.map(room => (
                    <div key={room.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <h3>{room.name}</h3>
                        <p><Tag size={16} /> {room.room_type} — <strong>{room.price_per_night}€</strong>/nuit</p>
                        <p><Users size={16} /> Capacité : {room.capacity} personnes</p>
                        <button style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Réserver maintenant
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomList;
