import { Request, Response } from 'express';
import { Task } from '../models/taskModel';

// GET all tasks
export const getAllTasks = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  try {
    const tasks = await Task.find({}).populate('relatedReview');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// GET task by ID
export const getTaskById = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { taskId } = req.params;
  try {
    const task = await Task.findOne({ _id: taskId}).populate('relatedReview');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

// CREATE new task
export const createTask = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { title, description, relatedReview, dueDate, priority } = req.body;
  try {
    const newTask = new Task({
      title,
      description,
      relatedReview,
      dueDate,
      priority,
      createdBy: req.userId
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
};

// UPDATE task
export const updateTask = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { taskId } = req.params;
  const updates = req.body;
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId},
      updates,
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
};

// DELETE task
export const deleteTask = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { taskId } = req.params;
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: taskId});
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
};

// MARK task as completed
export const completeTask = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { taskId } = req.params;
  try {
    const completedTask = await Task.findOneAndUpdate(
      { _id: taskId},
      { isCompleted: true },
      { new: true }
    );
    if (!completedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(completedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error completing task', error });
  }
};

export default {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask
};
