import NavBar from "./NavBar"

export default function Home() {
    return (
        <>
            <NavBar></NavBar>
            <div className="px-4 pt-5 my-5 text-center border-bottom">
                <h1 className="display-4 fw-bold">Ops CloudCraft</h1>
                <div className="col-lg-6 mx-auto">
                    <p className="lead mb-4">A Web Portal for all DevOps practices, designed to collaborate effectively with DevOps teams for seamless code deployments.</p>
                </div>
                <div className="overflow-hidden">
                    <div className="container px-5">
                        <img src="/devops_loop.jpeg" className="img-fluid border rounded-3 shadow-lg mb-4" alt="DevOps Image" loading=" lazy" />
                    </div>
                </div>
            </div>
        </>
    )
}