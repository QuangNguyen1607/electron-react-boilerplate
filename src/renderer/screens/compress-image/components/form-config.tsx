import { Button } from '@/src/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function FormConfig({ setConfig }) {
	const form = useForm({
		defaultValues: {
			lat: '',
			long: '',
			description: '',
			country: '',
			creator: '',
		},
	});
	const { reset } = form;
	const onSubmit = (values) => {
		window.electron.store.set('config', values);
		setConfig(values)
		toast.success('Saved information successfully');
	};
	useEffect(() => {
		const configStore = window.electron.store.get('config');
		if (configStore) {
			reset(configStore);
		}
	}, []);
	return (
		<div className='bg-foreground p-5 rounded-3xl mt-5'>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid grid-cols-2 gap-5"
				>
					<FormField
						control={form.control}
						name="lat"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Lat</FormLabel>
								<FormControl>
									<Input placeholder="" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="long"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Long</FormLabel>
								<FormControl>
									<Input placeholder="" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Input placeholder="" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="country"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Country</FormLabel>
								<FormControl>
									<Input placeholder="" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="creator"
						render={({ field }) => (
							<FormItem className='col-span-2'>
								<FormLabel>Creator</FormLabel>
								<FormControl>
									<Input placeholder="" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button className='w-full col-span-2' type="submit">Save Config</Button>
				</form>
			</Form>
		</div>
	);
}
