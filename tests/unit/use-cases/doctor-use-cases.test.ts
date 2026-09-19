import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDoctorRepository } from '../../mocks/in-memory-doctor.repository';
import { RegisterDoctorUseCase } from '@/core/application/use-cases/doctor/register-doctor.use-case';
import { ListDoctorsUseCase } from '@/core/application/use-cases/doctor/list-doctors.use-case';
import { UpdateDoctorUseCase } from '@/core/application/use-cases/doctor/update-doctor.use-case';
import { DeleteDoctorUseCase } from '@/core/application/use-cases/doctor/delete-doctor.use-case';

describe('Doctor Use Cases', () => {
  let doctorRepo: InMemoryDoctorRepository;
  let registerUseCase: RegisterDoctorUseCase;
  let listUseCase: ListDoctorsUseCase;

  beforeEach(() => {
    doctorRepo = new InMemoryDoctorRepository();
    registerUseCase = new RegisterDoctorUseCase(doctorRepo);
    listUseCase = new ListDoctorsUseCase(doctorRepo);
  });

  it('should register a new doctor successfully', async () => {
    const result = await registerUseCase.execute({
      name: 'Dr. Meredith Grey',
      specialty: 'General Surgery',
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Dr. Meredith Grey');
    expect(result.specialty).toBe('General Surgery');
    expect(result.isActive).toBe(true);

    const stored = await doctorRepo.findById(result.id);
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe('Dr. Meredith Grey');
  });

  it('should fail to register a doctor with empty name', async () => {
    await expect(
      registerUseCase.execute({
        name: '',
      })
    ).rejects.toThrowError('Doctor name cannot be empty');
  });

  it('should list all active doctors', async () => {
    await registerUseCase.execute({ name: 'Dr. A', specialty: 'Pediatrics' });
    await registerUseCase.execute({ name: 'Dr. B', specialty: 'Cardiology' });

    const list = await listUseCase.execute();
    expect(list.length).toBe(2);
    expect(list.map((d) => d.name)).toEqual(['Dr. A', 'Dr. B']);
  });

  it('should update doctor details successfully', async () => {
    const created = await registerUseCase.execute({ name: 'Dr. House', specialty: 'General' });
    const updateUseCase = new UpdateDoctorUseCase(doctorRepo);

    const updated = await updateUseCase.execute({
      id: created.id,
      name: 'Dr. Gregory House',
      specialty: 'Diagnostics',
    });

    expect(updated.name).toBe('Dr. Gregory House');
    expect(updated.specialty).toBe('Diagnostics');

    const stored = await doctorRepo.findById(created.id);
    expect(stored?.name).toBe('Dr. Gregory House');
  });

  it('should delete doctor successfully', async () => {
    const created = await registerUseCase.execute({ name: 'Dr. Cuddy', specialty: 'Endocrinology' });
    const deleteUseCase = new DeleteDoctorUseCase(doctorRepo);

    await deleteUseCase.execute(created.id);

    const stored = await doctorRepo.findById(created.id);
    expect(stored).toBeNull();
  });
});
