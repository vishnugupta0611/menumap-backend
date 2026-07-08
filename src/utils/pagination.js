export function getPagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function paginated(modelQuery, countQuery, query) {
  const { page, limit, skip } = getPagination(query);
  const [data, total] = await Promise.all([
    modelQuery.skip(skip).limit(limit),
    countQuery,
  ]);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
