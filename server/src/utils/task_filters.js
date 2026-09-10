export function filterTasks(tasks, filters = {}) {

    const {
        status,
        priority,
        search,
        tag
    } = filters;


    return tasks.filter((task) => {

        // ----------------------------------------------------
        // STATUS FILTER
        // ----------------------------------------------------

        if (
            status &&
            task.status !== status
        ) {
            return false;
        }


        // ----------------------------------------------------
        // PRIORITY FILTER
        // ----------------------------------------------------

        if (
            priority &&
            task.priority !== priority
        ) {
            return false;
        }


        // ----------------------------------------------------
        // SEARCH FILTER
        // ----------------------------------------------------

        if (search) {

            const searchText =
                search.toLowerCase();

            const title =
                task.title?.toLowerCase() || "";

            const description =
                task.description?.toLowerCase() || "";


            const matchesTitle =
                title.includes(searchText);

            const matchesDescription =
                description.includes(searchText);


            if (
                !matchesTitle &&
                !matchesDescription
            ) {
                return false;
            }
        }


        // ----------------------------------------------------
        // TAG FILTER
        // ----------------------------------------------------

        if (tag) {

            const taskTags =
                task.tags || [];


            const hasTag =
                taskTags.some(
                    (taskTag) =>
                        taskTag.toLowerCase() ===
                        tag.toLowerCase()
                );


            if (!hasTag) {
                return false;
            }
        }


        // ----------------------------------------------------
        // KEEP TASK
        // ----------------------------------------------------

        return true;
    });
}
