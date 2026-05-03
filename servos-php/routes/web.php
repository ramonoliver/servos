<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\ScheduleController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.attempt');
    Route::get('/cadastro', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/cadastro', [AuthController::class, 'register'])->name('register.store');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/membros', [MemberController::class, 'index'])->name('members.index');
    Route::get('/escalas', [ScheduleController::class, 'index'])->name('schedules.index');

    Route::middleware('role:admin,leader')->group(function () {
        Route::get('/ministerios', [DepartmentController::class, 'index'])->name('departments.index');
    });
});
