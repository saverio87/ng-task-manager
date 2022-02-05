import { Injectable } from '@angular/core';
import { Observable, takeLast, throwIfEmpty } from 'rxjs';
import { List } from './models/list.model';
import { Task } from './models/task.model';
import { WebRequestService } from './web-request.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webReqService: WebRequestService) { }

  

  getLists() : Observable<List[]> {
    return this.webReqService.get('lists');
  }

  createList(title: string) {
    return this.webReqService.post('lists', {title});
  }

  deleteList(listId: string) {
    return this.webReqService.delete(`lists/${listId}`);
  }

  updateList(listId: string, title: string) {
    return this.webReqService.patch(`lists/${listId}`, { title });
  }

  getTasks(listId: string) : Observable<Task[]> {
    return this.webReqService.get(`lists/${listId}/tasks`);
  }

  createTask(listId: string, title: string) {
    return this.webReqService.post(`lists/${listId}/tasks`, {title})
  }

  updateTask(listId: string, taskId: string, title: string) {
    return this.webReqService.patch(`lists/${listId}/tasks/${taskId}`, {title})
  }

  deleteTask(listId: string, taskId: string) {
    return this.webReqService.delete(`lists/${listId}/tasks/${taskId}`)
  }

   completeTask(task: Task) {
     return this.webReqService.patch(`lists/${task._listId}/tasks/${task._id}`, {
       completed: !task.completed,
       updated: Date.now()
     })
     
   }
};
