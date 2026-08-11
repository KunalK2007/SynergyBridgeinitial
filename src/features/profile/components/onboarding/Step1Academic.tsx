import { useFormContext } from "react-hook-form";
import { StudentProfileFormValues } from "@/lib/validation/profile";
import { Input } from "@/components/ui/Input";

export function Step1Academic() {
  const { register, formState: { errors } } = useFormContext<StudentProfileFormValues>();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Institution ID (or Name)</label>
          <Input 
            {...register("institutionId")} 
            placeholder="e.g. IIT Bombay" 
            error={errors.institutionId?.message}
          />
          <p className="text-xs text-slate-500 mt-1">Select your academic institution.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
          <Input 
            {...register("department")} 
            placeholder="e.g. Computer Science" 
            error={errors.department?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Course / Degree</label>
          <Input 
            {...register("course")} 
            placeholder="e.g. B.Tech" 
            error={errors.course?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Year</label>
            <Input 
              type="number"
              {...register("year")} 
              placeholder="e.g. 3" 
              error={errors.year?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Semester</label>
            <Input 
              type="number"
              {...register("semester")} 
              placeholder="e.g. 5" 
              error={errors.semester?.message}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
