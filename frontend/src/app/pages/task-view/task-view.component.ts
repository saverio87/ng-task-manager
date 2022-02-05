import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from 'src/app/task.service';
import { List } from 'src/app/models/list.model'
import { Task } from 'src/app/models/task.model'
import { faCog, faPlus, faEdit,faTrash } from '@fortawesome/free-solid-svg-icons';



@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {

  lists: List[];
  tasks: Task[];
  activeListId: string;
  activeListTitle: string;
  faCog = faCog;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) {
    
   }

  ngOnInit() {

    this.route.params.subscribe((params: Params)=> {
      
        if (params['listId']) {
          this.activeListId = params['listId'];

          // Grab title of list object whose ID is being passed as param
          this.activeListTitle = this.lists && this.lists.filter(list => list._id === this.activeListId)[0].title;

          // Get tasks relative to list with id == activeListIdUsed to be 'params.listId' -> Angular 13 change?
          this.taskService.getTasks(params['listId']).subscribe((tasks)=> {
          this.tasks = tasks;
        })
      } else {
        this.tasks = []
      }

    })

    this.taskService.getLists().subscribe((lists)=> {
      this.lists = lists;
    })
  }

  // Handle task click
  onTaskClick(task: Task) {
    this.taskService.completeTask(task).subscribe((task)=> {
      console.log(task);  
    })

    // manually trigger re-rendering of object (or the
     // component will only re-render on page refresh)
     task.completed = !task.completed;
  }

  // Handle delete list click

  onDeleteListClick = () => {
this.taskService.deleteList(this.activeListId).subscribe((res: any)=> {
  this.router.navigate(['/lists']);
  console.log(res);
  
})
  }

  onDeleteTaskClick(id: string) {
    this.taskService.deleteTask(this.activeListId, id).subscribe((res: any) => {
      // Updates the tasks array
      this.tasks = this.tasks.filter(val => val._id !== id);
      console.log(res);
    })
  }

  displayCreationDate(date: Date) {
    console.log(date)
    return date.toString
    
  }
  

}
