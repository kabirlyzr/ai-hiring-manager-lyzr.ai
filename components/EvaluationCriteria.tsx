/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { addCriterion, removeCriterion, Criterion } from '@/store/criteriaSlice';
import { RootState } from '@/store/store';

const EvaluationCriteria = () => {
  const { toast } = useToast();
  const router = useRouter();
  const dispatch = useDispatch();
  const criteria = useSelector((state: RootState) => state.criteria.criteria);

  const [newCriterion, setNewCriterion] = useState<Omit<Criterion, 'id'>>({
    name: "",
    description: "",
    weight: null as unknown as number
  });

  const handleAddCriterion = () => {
    if (!newCriterion.name) {
      toast({
        title: "Error",
        description: "Criterion name is required",
        variant: "destructive"
      });
      return;
    }

    if (!newCriterion.weight) {
      toast({
        title: "Error",
        description: "Weightage is required",
        variant: "destructive"
      });
      return;
    }

    dispatch(addCriterion({
      id: Date.now(),
      ...newCriterion
    }));
    setNewCriterion({ name: "", description: "", weight: null as unknown as number });
  };

  const handleSaveAndContinue = () => {
    if (criteria.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one evaluation criterion before continuing",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Evaluation criteria saved successfully",
    });
    
    router.push('/applicants');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Evaluation Criteria Setup</h1>
        <Button 
          onClick={handleSaveAndContinue}
          disabled={criteria.length === 0}
          className="bg-primary hover:bg-primary/90"
        >
          Save and Continue
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Criterion name"
          value={newCriterion.name}
          onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
          className="flex-1"
        />
        <Input
          placeholder="Evaluation criterion"
          value={newCriterion.description}
          onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
          className="flex-1"
        />
        <Select
          value={newCriterion.weight?.toString()}
          onValueChange={(value) => setNewCriterion({ ...newCriterion, weight: parseInt(value) })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Choose weightage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 (Lowest weightage)</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5 (Highest weightage)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddCriterion}>Add Criterion</Button>
      </div>

      {criteria.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No evaluation criteria added yet. Add at least one criterion to continue.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.map((criterion: any) => (
              <TableRow key={criterion.id}>
                <TableCell>{criterion.name}</TableCell>
                <TableCell>{criterion.description}</TableCell>
                <TableCell>{criterion.weight}</TableCell>
                <TableCell className='flex justify-end'>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => dispatch(removeCriterion(criterion.id))}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default EvaluationCriteria;