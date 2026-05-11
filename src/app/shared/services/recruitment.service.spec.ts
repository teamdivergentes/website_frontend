import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RecruitmentService } from './recruitment.service';
import type { RecruitmentPost, CreateRecruitmentDto, UpdateRecruitmentDto } from '../models';

const BASE = 'http://localhost:3000/api/recruitment';

const MOCK_POST: RecruitmentPost = {
  id: 1,
  title: 'Coach Valorant',
  type: 'Benevole',
  description: 'Nous recherchons un coach Valorant.',
  active: true,
  position: 1,
  slug: 'coach-valorant',
};

const MOCK_POST_2: RecruitmentPost = {
  id: 2,
  title: 'Manager',
  type: 'Benevole',
  description: 'Manager structure.',
  active: false,
  position: 2,
  slug: 'manager',
};

describe('RecruitmentService', () => {
  let service: RecruitmentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        RecruitmentService,
      ],
    });
    service = TestBed.inject(RecruitmentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ------------------------------------------------------------------ //
  // loadActivePosts()
  // ------------------------------------------------------------------ //

  it('loadActivePosts() doit appeler GET /api/recruitment et populer le signal', () => {
    let result: RecruitmentPost[] | undefined;
    service.loadActivePosts().subscribe(p => (result = p));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_POST]);

    expect(result).toEqual([MOCK_POST]);
    expect(service.allPosts().length).toBe(1);
  });

  it('activePosts computed filtre les offres inactives', () => {
    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([MOCK_POST, MOCK_POST_2]);

    expect(service.activePosts().length).toBe(1);
    expect(service.activePosts()[0].id).toBe(1);
  });

  it('allPosts computed trie par position', () => {
    const postA: RecruitmentPost = { ...MOCK_POST, id: 3, position: 2 };
    const postB: RecruitmentPost = { ...MOCK_POST_2, id: 4, position: 1 };

    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([postA, postB]);

    expect(service.allPosts()[0].id).toBe(4);
    expect(service.allPosts()[1].id).toBe(3);
  });

  // ------------------------------------------------------------------ //
  // loadAllPosts() (admin)
  // ------------------------------------------------------------------ //

  it('loadAllPosts() doit appeler GET /api/recruitment/admin/all', () => {
    service.loadAllPosts().subscribe();

    const req = http.expectOne(`${BASE}/admin/all`);
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_POST, MOCK_POST_2]);

    expect(service.allPosts().length).toBe(2);
  });

  // ------------------------------------------------------------------ //
  // getPostById()
  // ------------------------------------------------------------------ //

  it('getPostById() doit appeler GET /api/recruitment/:id', () => {
    let result: RecruitmentPost | undefined;
    service.getPostById(1).subscribe(p => (result = p));

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_POST);

    expect(result).toEqual(MOCK_POST);
  });

  // ------------------------------------------------------------------ //
  // getPostBySlug()
  // ------------------------------------------------------------------ //

  it('getPostBySlug() doit appeler GET /api/recruitment/by-slug/:slug', () => {
    let result: RecruitmentPost | undefined;
    service.getPostBySlug('coach-valorant').subscribe(p => (result = p));

    const req = http.expectOne(`${BASE}/by-slug/coach-valorant`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_POST);

    expect(result).toEqual(MOCK_POST);
  });

  // ------------------------------------------------------------------ //
  // createPost()
  // ------------------------------------------------------------------ //

  it('createPost() doit appeler POST /api/recruitment et ajouter au signal', () => {
    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([]);

    const dto: CreateRecruitmentDto = {
      title: 'Graphiste',
      type: 'Benevole',
      description: 'Nous cherchons un graphiste.',
    };
    const created: RecruitmentPost = { id: 10, ...dto, active: true, position: 3 };
    let result: RecruitmentPost | undefined;

    service.createPost(dto).subscribe(p => (result = p));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);

    expect(result).toEqual(created);
    expect(service.allPosts()).toContain(created);
  });

  // ------------------------------------------------------------------ //
  // updatePost()
  // ------------------------------------------------------------------ //

  it('updatePost() doit appeler PUT /api/recruitment/:id et mettre a jour le signal', () => {
    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([MOCK_POST]);

    const dto: UpdateRecruitmentDto = { title: 'Coach Val Updated' };
    const updated: RecruitmentPost = { ...MOCK_POST, title: 'Coach Val Updated' };
    let result: RecruitmentPost | undefined;

    service.updatePost(1, dto).subscribe(p => (result = p));

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(updated);

    expect(result).toEqual(updated);
    expect(service.allPosts()[0].title).toBe('Coach Val Updated');
  });

  it('updatePost() ne modifie pas le signal si l\'id n\'est pas trouve', () => {
    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([MOCK_POST]);

    service.updatePost(999, { title: 'Fantome' }).subscribe();
    const req = http.expectOne(`${BASE}/999`);
    req.flush({ ...MOCK_POST, id: 999, title: 'Fantome' });

    expect(service.allPosts().length).toBe(1);
    expect(service.allPosts()[0].id).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // deletePost()
  // ------------------------------------------------------------------ //

  it('deletePost() doit appeler DELETE /api/recruitment/:id et retirer du signal', () => {
    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([MOCK_POST, MOCK_POST_2]);

    service.deletePost(1).subscribe();

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.allPosts().length).toBe(1);
    expect(service.allPosts().find(p => p.id === 1)).toBeUndefined();
  });

  // ------------------------------------------------------------------ //
  // toggleActive()
  // ------------------------------------------------------------------ //

  it('toggleActive() doit appeler PATCH /api/recruitment/:id/toggle et mettre a jour le signal', () => {
    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([MOCK_POST]);

    const toggled: RecruitmentPost = { ...MOCK_POST, active: false };
    let result: RecruitmentPost | undefined;

    service.toggleActive(1).subscribe(p => (result = p));

    const req = http.expectOne(`${BASE}/1/toggle`);
    expect(req.request.method).toBe('PATCH');
    req.flush(toggled);

    expect(result?.active).toBeFalse();
    expect(service.allPosts()[0].active).toBeFalse();
  });

  // ------------------------------------------------------------------ //
  // reorderPosts()
  // ------------------------------------------------------------------ //

  it('reorderPosts() doit appeler PATCH /api/recruitment/reorder et mettre a jour les positions', () => {
    const p1: RecruitmentPost = { ...MOCK_POST, id: 1, position: 1 };
    const p2: RecruitmentPost = { ...MOCK_POST_2, id: 2, position: 2 };

    service.loadActivePosts().subscribe();
    http.expectOne(BASE).flush([p1, p2]);

    const reorder = [
      { id: 1, position: 2 },
      { id: 2, position: 1 },
    ];
    service.reorderPosts(reorder).subscribe();

    const req = http.expectOne(`${BASE}/reorder`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ items: reorder });
    req.flush(null);

    const post1 = service.allPosts().find(p => p.id === 1);
    const post2 = service.allPosts().find(p => p.id === 2);
    expect(post1?.position).toBe(2);
    expect(post2?.position).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // applyToPost()
  // ------------------------------------------------------------------ //

  it('applyToPost() doit appeler POST /api/recruitment/apply avec un FormData', () => {
    const formData = new FormData();
    formData.append('name', 'Jean Dupont');
    formData.append('email', 'jean@test.fr');

    let result: { success: boolean; message: string } | undefined;
    service.applyToPost(formData).subscribe(r => (result = r));

    const req = http.expectOne(`${BASE}/apply`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'Candidature envoyee.' });

    expect(result?.success).toBeTrue();
  });

  it('applyToPost() doit propager les erreurs HTTP', () => {
    const formData = new FormData();
    let errorReceived = false;

    service.applyToPost(formData).subscribe({
      error: () => (errorReceived = true),
    });

    const req = http.expectOne(`${BASE}/apply`);
    req.flush('Erreur', { status: 500, statusText: 'Internal Server Error' });

    expect(errorReceived).toBeTrue();
  });
});
