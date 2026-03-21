type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; mssg: string };

export function errorHandeler<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>
) {
  return async (args: TArgs): Promise<ActionResponse<TResult>> => {
    try {
      const data = await fn(args);

      return {
        success: true,
        data,
      };
    } catch (error:any) {
      console.error(error);
      if (
        error.code === "P2002"
      ) {
        const field =
          error?.meta?.driverAdapterError?.cause?.constraint?.fields?.[0];


        return {
          success: false,
          mssg: `${field} already exists`,
        };
      }

      return {
        success: false,
        mssg:
          error instanceof Error ? error.message : "Something went wrong",
      };
    }
  };
}