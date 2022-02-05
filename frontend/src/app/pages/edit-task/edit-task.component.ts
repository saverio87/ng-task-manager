import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent implements OnInit {

  listId: string;
  taskId: string;

  constructor(private router: Router, private taskService: TaskService, private route: ActivatedRoute) { }

  ngOnInit(): void {

    this.route.params.subscribe((params: Params)=> {
      this.listId = params['listId'];
        this.taskId = params['taskId']

      })
    }

    updateTask(title: string) {
      this.taskService.updateTask(this.listId, this.taskId, title).subscribe(() => {
        this.router.navigate(['/lists', this.listId]);
      })
    }

  }


