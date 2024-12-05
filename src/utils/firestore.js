// src/utils/firestore.js
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const savePosition = async (userId, position) => {
    try {
        const docRef = await addDoc(collection(db, 'positions'), {
            userId,
            ...position,
            createdAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving position:', error);
        throw error;
    }
};

export const getPositions = async (userId) => {
    try {
        const q = query(collection(db, 'positions'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const positions = [];
        querySnapshot.forEach((doc) => {
            positions.push({ id: doc.id, ...doc.data() });
        });
        return positions;
    } catch (error) {
        console.error('Error getting positions:', error);
        throw error;
    }
};