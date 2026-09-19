import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDoctorRepository } from '../../mocks/in-memory-doctor.repository';
import { RegisterDoctorUseCase } from '@/core/application/use-cases/doctor/register-doctor.use-case';
import { ListDoctorsUseCase } from '@/core/application/use-cases/doctor/list-doctors.use-case';

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
});
