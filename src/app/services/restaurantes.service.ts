import { Injectable } from '@angular/core'; import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDocs } from '@angular/fire/firestore'; import { firstValueFrom } from 'rxjs'; import { Restaurante } from '../models/restaurante';
@Injectable({providedIn:'root'}) export class RestaurantesService {
 constructor(private firestore: Firestore) {}
 async getAll(): Promise<Restaurante[]> { return await firstValueFrom(collectionData(collection(this.firestore,'restaurantes'),{idField:'id'})) as Restaurante[]; }
 async add(r: Restaurante): Promise<void> { const {id,...data}=r; await addDoc(collection(this.firestore,'restaurantes'),data); }
 async remove(r: Restaurante): Promise<void> { if(!r.id) throw new Error('Restaurante sin id'); await deleteDoc(doc(this.firestore,'restaurantes',r.id)); }
 async replaceAll(items: Restaurante[]): Promise<void> { const snap=await getDocs(collection(this.firestore,'restaurantes')); for(const d of snap.docs) await deleteDoc(d.ref); for(const r of items) await this.add(r); }
}
