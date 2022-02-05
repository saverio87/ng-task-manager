import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent implements OnInit {

  currentListId: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  

  ngOnInit(): void {

    this.route.params.subscribe((params: Params)=> {
      if (params['listId']) {
        this.currentListId = params['listId'];
      }
      })
    }

    createTask(title: string) {
      this.taskService.createTask(this.currentListId, title).subscribe((newTask: Task)=> {
      console.log(newTask);

      // Redirecting to lists/currentlistId
      const listId = this.currentListId;
      this.router.navigate(['lists/' + listId])
  
      })
    }

}

  
